import { Database, DocumentCollection } from "arangojs";
import * as genUuid from "uuid/v4";


export interface DocumentIndex
{
    id: string;
}

export interface ArangoDocumentIndex
{
    _key: string;
    _id?: string;
    _rev?: string;
}

export default class Collection<DocumentData extends object>
{
    readonly name: string;
    protected readonly template: DocumentData;
    protected collection: DocumentCollection;

    constructor(name: string, template?: DocumentData)
    {
        this.name = name;
        this.template = template;
    }

    async initialize(db: Database): Promise<any>
    {
        this.collection = db.collection(this.name);

        return this.collection.create({}).catch(message => {
            let body = message.response.body;
            if (body.code === 409) {
                return; // collection exists
            }

            throw body.errorMessage;
        });
    }

    async list() : Promise<string[]>
    {
        return this.collection.list("key");
    }

    async create(document: DocumentData): Promise<DocumentData & DocumentIndex>
    {
        let data = this.validate({ }, document, /* replace */ true);
        data._key = (<DocumentData & DocumentIndex>document).id || genUuid();

        return this.collection.save(data).then(() => {
            return this.read(data);
        });
    }

    async update(document: object & DocumentIndex): Promise<boolean>
    {
        let data = this.validate({ }, document, /* replace */ true);

        return this.collection.update(document.id, data).then(() => {
            return true;
        });
    }

    async replace(document: object & DocumentIndex): Promise<boolean>
    {
        let data = this.validate({ }, document, /* replace */ true);

        return this.collection.replace(document.id, data).then(() => {
            return true;
        });
    }

    async remove(identifier: string | DocumentIndex) : Promise<boolean>
    {
        let id = typeof identifier === "string" ? identifier : identifier.id;
        return this.collection.remove(id);
    }

    async findById(identifier: string | DocumentIndex) : Promise<DocumentData & DocumentIndex>
    {
        let id = typeof identifier === "string" ? identifier : identifier.id;
        return this.collection.document(id).then(result => {
            return this.read(result);
        });
    }

    async findOne(example: object) : Promise<DocumentData & DocumentIndex>
    {
        return this.collection.firstExample(example).then(result => {
            return this.read(result);
        });
    }

    async findAll(example: string | object, value?: any) : Promise<Array<DocumentData & DocumentIndex>>
    {
        function readCursorAll(cursor) : Promise<Array<DocumentData & DocumentIndex>> {
            let documents = [];
            return cursor.all().then(results => {
                for (let result of results) {
                    documents.push(this.read(result));
                }
                return documents;
            });
        }

        if (typeof example === "object") {
            return this.collection.byExample(example).then(cursor => {
                return readCursorAll(cursor);
            });
        }
        else {
            return this.collection.fulltext(example, value).then(cursor => {
                return readCursorAll(cursor);
            });
        }
    }

    async count() : Promise<number>
    {
        return this.collection.count();
    }

    read(data: DocumentData & ArangoDocumentIndex) : DocumentData & DocumentIndex
    {
        let document = { id: data._key };

        for (let key in data) {
            if (key !== "_key" && key !== "_id" && key !== "_rev") {
                document[<string>key] = data[key];
            }
        }

        return <DocumentData & DocumentIndex>(document);
    }

    validate(target: object, source: object, replace: boolean = false) : DocumentData & ArangoDocumentIndex
    {
        return this._validate(target, source, this.template, replace);
    }

    private _validate(target: any, source: any, template: any, replace: boolean) : any
    {
        if (template === undefined) {
            return undefined;
        }

        const sourceType = typeof source;
        const templateType = typeof template;

        if (sourceType !== templateType) {
            return undefined;
        }

        const targetType = typeof target;
        if (sourceType === "object") {
            const sourceIsArray = Array.isArray(source);
            const targetIsArray = Array.isArray(target);
            const templateIsArray = Array.isArray(template);

            if (sourceIsArray !== templateIsArray) {
                return undefined;
            }

            if (templateIsArray && (!targetIsArray || replace)) {
                target = [];
            }
            else if (!templateIsArray && (targetType !== "object" || replace)) {
                target = {};
            }

            for (let key in template) {
                if (template.hasOwnProperty(key)) {
                    const value = this._validate(target[key], source[key], template[key], replace);
                    if (value !== undefined) {
                        target[key] = value;
                    }
                    else if (replace && key in target) {
                        delete target.key;
                    }
                }
            }
        }
        else {
            target = source;
        }

        return target;
    }
}