//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2021 vzroman
// Author: Vozzhenikov Roman, vzroman@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//------------------------------------------------------------------------------------

import {Controller as Item} from "../item.js";
import * as util from "../../utilities/data.js";

export class Controller extends Item{

    static options = {
        autoCommit:false,
        connection:undefined,
        timeout: 60000,
        subscribe:false
    };

    constructor( options ){
        super( options );

        if (typeof this._options.connection !== "function")
            throw new Error("invalid connection: " + this._options.connection);
    }
    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( Data ){
        return this._promise("init",(resolve, reject)=>{

            let ID = undefined;
            if (typeof Data === "string"){
                ID = Data;
            }else if(typeof Data === "object" && Data.constructor === Object){
                if (Data[".oid"]){
                    ID = Data[".oid"];
                }else{

                    // This is an object creation with a predefined data
                    return resolve( super.init( Data ) );
                }
            }

            const defaults = this._schema.get({});

            if ( ID === undefined ) {
                // This is an object creation with defaults
                return resolve( super.init( defaults ) );
            }

            // Obtain the actual data from the database
            const filter = `.oid = $oid('${ ID }')`;

            this.query( filter ).then(data => {

                if ( data ) {
                    this._ID = ID;
                    this._filter = filter;
                }else{
                    data = defaults;
                }

                resolve( super.init( data ) );

            }, reject);
        });

    }

    rollback(changes, error){
        return this._promise("rollback",(resolve, reject) => {

            if (changes || !this._filter) {
                resolve( super.rollback(changes, error) );
            }else{
                this.refresh().then(result =>{

                    this._trigger("rollback", error);

                    resolve( result );

                }, reject);
            }
        });
    }

    refresh( data ){
        if ( !data ){
            return this._promise("refresh",(resolve, reject) => {

                if (this._filter === undefined) return reject("not initialized");

                this.query( this._filter) .then(data => {

                    super.refresh( data ).then( resolve, reject );

                }, reject);
            });
        }else{
            return super.refresh( data );
        }
    }

    query( filter ){
        return new Promise((resolve, reject) => {

            const fields = this._schema.filter({virtual:false}).join(",").map(this.constructor.toSafeFieldName);

            this._options.connection().get(`get ${ fields } from * where ${ filter } format $to_json`,Items=>{
                 let item = Object.entries( Items[0] ).map(([name, value])=>{ return [ this.constructor.fromSafeFieldName(name), value ] });
                 item = Object.fromEntries( item );
                resolve( item );

            }, reject, this._options.timeout );
        });
    }

    setSubscribe( value ){
        // TODO
    }

    commit(){
        return this._promise("commit",(resolve, reject)=>{

            const onReject = error => {
                this._trigger("reject", error);
                return reject( error );
            }
            if ( !this.isCommittable() ) return onReject("not ready");

            if ( this._ID ){
                // the object already exits
                const changes = this._schema.filter( {virtual:false}, util.patch2value(this._changes, 0) );
                if ( !Object.keys(changes).length ){
                    // No changes in persistent fields
                    super.commit().then(resolve, reject);
                }else{
                    // Send a query to the database
                    this._options.connection().edit_object(this._ID, changes, ()=>{

                        super.commit().then(resolve, reject);

                        // Request the updated item from the database
                        if (!this._schema) return; // if the schema is undefined then the object is already destroyed
                        this.refresh();

                    }, onReject, this._options.timeout);
                }
            }else{
                // new object
                const fields = this._schema.filter( {virtual:false}, this.get() );
                this._options.connection().create_object(fields, ID=>{

                    this._ID = ID;

                    this._filter = `.oid = $oid('${ ID }')`;

                    super.commit().then(resolve, reject);

                    if (!this._schema) return; // if the schema is undefined then the object is already destroyed
                    this.refresh();

                },onReject, this._options.timeout);
            }
        });
    }

    static keywords = new Set(["AND", "ANDNOT", "AS", "BY", "DELETE", "DESC", "GROUP","GET","FROM","SUBSCRIBE","UNSUBSCRIBE",
                "INSERT","UPDATE","LOCK","OR","ORDER","PAGE","READ", "SET","IN","TRANSACTION_START","TRANSACTION_COMMIT",
                "TRANSACTION_ROLLBACK","WHERE","WRITE","STATELESS","NO_FEEDBACK","FORMAT","TEXT","HEX","COMMENT_MULTILINE",
                "WHITESPACE","INTNUM","FLOATDEC","FLOATSCI","FIELD","ATOM","S","ALL","EQ","EQS","GTS","LTS","GTES","LTES","NES",
                "LIKE","LIKES","OPEN","CLOSE","LIST_OPEN","LIST_CLOSE","COMMA","SEMICOLON","COLON"]);

    static toSafeFieldName( name ){
        return this.keywords.has(name.toUpperCase()) ? `'${ name }'` : name ;
    }

    static fromSafeFieldName( field ){
        if (field.startsWith("'") && field.slice(-1) ==="'"){
            return field.slice(1,-1);
        }else{
            return field;
        }
    }


}
Controller.extend();
