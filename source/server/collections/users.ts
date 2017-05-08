import * as credential from "credential";
let passwordTools = credential();

import Collection from "./Collection";

export interface User
{
    email: string;
    username: string;

    credentials: {
        local?: {
            password: string;
        },
        facebook?: {
            id: string;
        }
    }
}

class UserCollection extends Collection<User>
{
    constructor()
    {
        super("Users", UserCollection.template);
    }

    protected static readonly template : User = {
        email: "",
        username: "",
        credentials: {
            local: {
                password: ""
            },
            facebook: {
                id: ""
            }
        }
    };

    hashPassword(password: string): Promise<string>
    {
        return new Promise((resolve) => {
            passwordTools.hash(password, (err: any, result: string) => {
                if (err) {
                    throw(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    isValidPassword(user: User, userPassword: string) : Promise<boolean>
    {
        return new Promise((resolve) => {
            let storedPassword = user.credentials.local.password;
            passwordTools.verify(storedPassword, userPassword, (err: string, isValid: boolean) => {
                if (err) throw err;
                resolve(isValid);
            });
        });
    }
}

export default new UserCollection();