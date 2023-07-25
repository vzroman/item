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
import {diff,patch2value} from "../../utilities/data.js";

function oidCompare([a], [b]) {
    a = a.split(",");
    a = [
        parseInt( a[0].substring(1) ),
        parseInt( a[1] )
    ];
    b = b.split(",");
    b = [
        parseInt( b[0].substring(1) ),
        parseInt( b[1] )
    ];

    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    if (a[1] > b[1]) return 1;
    if (a[1] < b[1]) return -1;

    return 0;
}

export class Controller extends Collection{

    static options = {
        autoCommit:false,
        connection:undefined,
        timeout: 60000,
        subscribe:false,
        serverPaging: false
    };

    constructor( options ){

        options.id = ".oid";
        if (!options.keyCompare && options.orderBy === ".oid" ){
            options.keyCompare = oidCompare
        }
        // id is always oid
        super( options );

        if (typeof this._options.connection !== "function")
            throw new Error("invalid connection: " + this._options.connection);
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( filter ){

        return this._promise("init",(resolve, reject) => {

            const _filter = this.constructor.filter2query( filter );

            this.query( _filter ).then(data => {

                this._filter = filter;
                this.option("filter", filter);

                resolve( super.init(data) );

            }, reject);
        });
    }

    updatePage() {
        if (this._options.serverPaging && this._filter) {
            this.refresh();
        } else {
            super._updateView();
        }
    }

    forEach( callback ){
        if (this._view){
            if (this._options.serverPaging) {
                this._view.forEach(n => callback( n.key[1] ));
            } else {
                super.forEach( callback );
            }
        }
    }

    rollback(changes, error){
        return this._promise("rollback",(resolve, reject) => {

            if (changes) {
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

        return new Promise((resolve, reject)=>{

            const fields = [this._options.id, ...this._schema.filter({virtual:false})].join(",");
            const {
                serverPaging,
                page,
                pageSize,
                connection,
                timeout
            } = this._options;

            const pagination = serverPaging && page !== undefined && pageSize !== undefined
                ? `PAGE ${page}:${pageSize}`
                : "";

            connection().query(`get ${ fields } from * where ${ filter } format $to_json ${pagination}`, result => {
                if (pagination !== ""){
                    this._totalCount = result.count;
                    result = result.result;
                }else{
                    this._totalCount = result.length - 1;
                }

                const [header,...items] = result;
                result = items.map( fields =>{
                    const item = {};
                    for (let i = 0; i < header.length; i++){
                        item[header[i]] = fields[i]
                    }
                    return item;
                })
                resolve( result );
            }, reject, timeout );
        });
    }

    getCount() {
        return this._totalCount;
    }

    setSubscribe( value ){
        // TODO
    }

    commit( idList ){
        if ( idList ){
            return super.commit( idList );
        }else{
            return this._promise("commit",(resolve, reject)=>{

                const onReject = error => {
                    this._trigger("reject", error);
                    return reject( error );
                }

                if ( !this.isCommittable() ) return onReject("not ready");

                this.constructor.transaction(this._changes,  this._options.connection(), this._options.timeout)
                    .then(()=>{

                        // The changes settled to the database
                        super.commit().then(resolve, reject);

                        // Refresh the data after successful commit
                        this.refresh();

                    }, onReject);
            });
        }
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
                    let changedFields = diff( changes[id][1], changes[id][0] );
                    if (changedFields){
                        changedFields = patch2value(changedFields, 0);
                        await update(id, changedFields);
                    }
                }
            }

            return await query("TRANSACTION_COMMIT");
        }catch (e){
            connection.query("TRANSACTION_ROLLBACK",()=>{}, error=>{
                console.error("error on transaction rollback", error, e);
            });
            throw e;
        }
    }
}
Controller.extend();
