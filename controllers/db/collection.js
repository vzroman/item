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
import {Controller as Collection} from "../collection.js";

export class Controller extends Collection{

    static options = {
        connection:undefined,
        timeout: 60000,
        subscribe:false
    };

    constructor( options ){
        // id is always oid
        super( {...options, id:".oid"} );

        if (typeof this._options.connection !== "function")
            throw new Error("invalid connection: " + this._options.connection);
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( filter ){

        return new Promise((resolve, reject) => {

            const filter = this.constructor.filter2query( filter );

            this.query( filter ).then(data => {

                this._filter = filter;

                resolve( super.init(data) );

            }, reject);
        });
    }


    query( filter ){

        return new Promise((resolve, reject)=>{

            const fields = [this._options.id, ...this._schema.filter({virtual:false})].join(",");

            this._options.connection().get(`get ${ fields } from * where ${ filter } format $to_json`, resolve, reject, this._options.timeout );
        });
    }

    setSubscribe( value ){
        // TODO
    }

    commit(){
        return new Promise((resolve, reject)=>{

            // This is a refreshing, the changes came from the database, there is no need to commit them back
            if (this._isRefresh) return super.commit().then(resolve,reject);

            if ( !this.isCommittable() ) return reject("not ready");

            this.constructor.transaction(this._changes,  this._options.connection(), this._options.timeout)
                .then(()=>{
                    super.commit(). then(resolve, reject);
                    this.refresh();
                }, reject);
        });
    }

    _refresh( data ){
        Object.keys({...this._data,...this._changes}).forEach(id => {

            // The item doesn't exist anymore or do not satisfies the query conditions
            if (!data.hasOwnProperty(id)) data[id] = null;
        });

        return super._refresh( data );
    }

    static filter2query( filter ){
        if ( filter[0] === "and" || filter[0] === "or"){
            return `${ filter[0] }(${ filter[1].map( this.filter2query ).join(",") })`;
        }else if(filter[0] === "andnot"){
            return `andnot(${ this.filter2query(filter[1][0]) }, ${ this.filter2query(filter[1][1]) })`;
        }else{
            let [ field, operator, value ] = filter;

            if (operator === "[]"){
                let [from, to] = value;
                if (typeof from === "string"){ from = `'${ from }'`}
                if (typeof to === "string"){ to = `'${ to }'`}

                return field +" [" +from+":"+to+"]";
            }else{
                if (typeof value === "string"){
                    if ( value.startsWith("'") ){
                        value = value.substr(1);
                    }else if ( !value.startsWith("$") ){
                        value = `'${ value }'`;
                    }
                }

                return `${ field } ${ operator } ${ value }`;
            }
        }
    }

    static async transaction( changes, connection, timeout ){
        const query = query => {
            return new Promise((resolve, reject)=>{
                connection.query(query, resolve, reject, timeout);
            })
        };

        const create = fields => {
            return new Promise((resolve, reject)=>{
                connection.create_object(fields, resolve, reject, timeout);
            })
        };

        const update = (id,fields) => {
            return new Promise((resolve, reject)=>{
                connection.edit_object(id, fields, resolve, reject, timeout);
            })
        };

        const remove = (id) => {
            return new Promise((resolve, reject)=>{
                connection.delete_object(id, resolve, reject, timeout);
            })
        };

        try{
            await query("TRANSACTION_START");

            for(const id in changes){
                if(changes[id][0] && !changes[id][1]){
                    await create( changes[id][0] );
                }else if(!changes[id][0] && changes[id][1]){
                    await remove( id );
                }else{
                    await update(id, changes[id][0]);
                }
            }

            await query("TRANSACTION_COMMIT");
        }catch (e){
            connection.query("TRANSACTION_ROLLBACK",()=>{}, error=>{

                console.error("error on transaction rollback", error, e);

                throw e
            });
        }
    }
}
Controller.extend();