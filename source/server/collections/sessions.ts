import Collection from "./Collection";

export interface SessionDocument
{
    userId: string,
    sessionId: string
}

export class SessionCollection extends Collection<SessionDocument>
{
    constructor()
    {
        super("Sessions", SessionCollection.template);
    }

    protected static readonly template : SessionDocument = {
        userId: "",
        sessionId: ""
    }
}