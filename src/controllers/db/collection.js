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
import {Controller as ItemController} from "./item.js";
import {deepEqual, diff, patch2value} from "../../utilities/data.js";

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
        DBs:undefined,
        autoCommit:false,
        connection:undefined,
        timeout: 60000,
        subscribe:false,
        serverPaging: false,
        request:true,
        filter:undefined
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

        this._subscription = undefined;
        this.bind("$.subscribe",value => this.setSubscribe( value ) );

        this.bind("$.filter",(value, prev) => {
            if (!this._filter) return;
            if (!this._options.subscribe) return;
            if (deepEqual(value, prev)) return;

            this.setSubscribe( false );
            this.setSubscribe( this._options.subscribe );
        });
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( filter ){

        return new Promise((resolve, reject) => {

            this._filter = this.constructor.filter2query( filter );

            this.query().then(data => {

                resolve( super.init(data) );

                if (this._options.subscribe) this.setSubscribe( this._options.subscribe );

            }, reject);
        }).catch(error=>this._trigger("error", [error, "init"]));
    }

    updatePage() {
        if (this._options.serverPaging && this._filter && this._subscription === undefined) {

            // Check if the query is already active
            if (this._options.request){
                return this._options.request.finally(()=>{
                    if (this.isDestroyed()) return;
                    this.updatePage();
                });
            }

            // Check if the page is already loaded
            if (this.__queryPage.page === this._options.page && this.__queryPage.pageSize === this._options.pageSize){
                return;
            }
            return this.refresh();
        } else {
            return super._updateView();
        }
    }

    forEach( callback ){
        if (this._view){
            if (this._options.serverPaging && this._subscription === undefined) {
                this._view.forEach(n => callback( n.key[1] ));
            } else {
                super.forEach( callback );
            }
        }
    }

    rollback(changes, error){
        return new Promise((resolve, reject) => {

            if (changes) {
                resolve( super.rollback(changes, error) );
            }else{
                this.refresh().then(result =>{

                    this._trigger("rollback", error);

                    resolve( result );

                }, reject);
            }
        }).catch(error=>this._trigger("error", [error, "rollback"]));
    }

    refresh( data ){
        if ( !data ){
            return new Promise((resolve, reject) => {

                if (this._filter === undefined) return reject("not initialized");

                this.query().then(data => {

                    super.refresh( data ).then( resolve, reject );

                }, reject);
            }).catch(error=>this._trigger("error", [error, "refresh"]));
        }else{
            return super.refresh( data );
        }
    }

    filter(){
        this.refresh();
    }

    query(){
        return this.queueRequest((resolve, reject)=>{
            this.__queryPage = {
                page: this._options.page,
                pageSize:this._options.pageSize
            };

            let filter = this._filter;

            if (this._options.filter){
                filter = `and(${ filter }, ${ this.constructor.filter2query( this._options.filter ) })`;
            }

            const fields = [this._options.id, ...this._schema.filter({virtual:false})]
                .map(name => ItemController.toSafeFieldName( name ))
                .join(",");

            const {
                serverPaging,
                page,
                pageSize,
                connection,
                timeout
            } = this._options;

            const pagination = serverPaging && page !== undefined && pageSize !== undefined && this._subscription === undefined
                ? `PAGE ${page}:${pageSize}`
                : "";

            const DBs = Array.isArray( this._options.DBs)
                ? this._options.DBs.join(",")
                : typeof this._options.DBs === "string"
                    ? this._options.DBs
                    : "*";

            const orderBy = !this._options.orderBy || this._options.orderBy === ".oid" || this._subscription !== undefined
                ? ""
                : "order by " + this._options.orderBy;

            connection().query(`get ${ fields } from ${ DBs } where ${ filter } ${ orderBy } format $to_json ${pagination}`, result => {
                if (pagination !== ""){
                    this._totalCount = result.count;
                    result = result.result;
                }else{
                    this._totalCount = result.length - 1;
                }

                let [header,...items] = result;
                header = header.map( f => ItemController.fromSafeFieldName(f) );

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

        if (!this._filter) return;

        if (!this._subscription && value){

            let filter = this._filter;

            if (this._options.filter){
                filter = `and(${ filter }, ${ this.constructor.filter2query( this._options.filter ) })`;
            }

            const queryFields = [this._options.id, ...this._schema.filter({virtual:false})]
                .map(name => ItemController.toSafeFieldName( name ))
                .join(",");

            this._subscription = this._options.connection().subscribe(`get ${ queryFields } from * where ${ filter } format $to_json`,
                //------------create--------------------------
                ({oid, fields})=>{
                    if (!this.get(oid)) this._totalCount++;

                    const update = {};
                    for (const f in fields){
                        update[ ItemController.fromSafeFieldName(f) ] = fields[f];
                    }
                    this.refreshItem(oid, update);
                },
                //------------update--------------------------
                ({oid, fields})=>{
                    const update = this.get(oid) ?? {};
                    for (const f in fields){
                        update[ ItemController.fromSafeFieldName(f) ] = fields[f];
                    }
                    this.refreshItem(oid, update);
                },
                //------------delete--------------------------
                ({oid})=>{
                    if (this.get(oid)) this._totalCount--;
                    this.refreshItem(oid, null);
                },
                console.error);
        }else if(this._subscription && !value){
            this._options.connection().unsubscribe( this._subscription );
        }
    }

    refreshItem( oid, fields ){
        const isRefresh = this._isRefresh;
        this._isRefresh = true;

        this.set({[oid]: fields});

        if (this._changes && this._changes[oid]){
            this._data[oid] = this._changes[oid][0];
            delete this._changes[oid];
        }

        this._isRefresh = isRefresh;
    }

    commit( idList ){
        if ( idList ) {
            return super.commit(idList);
        }else{
            return this.queueRequest((resolve, reject)=>{

                const onReject = error => {
                    this._trigger("reject", error);
                    return reject( error );
                }

                if ( !this.isCommittable() ) return onReject("not ready");

                const DBs = Array.isArray( this._options.DBs)
                    ? this._options.DBs.join(",")
                    : typeof this._options.DBs === "string"
                        ? this._options.DBs
                        : "*";

                this.constructor.transaction(DBs, this._changes,  this._options.connection(), this._options.timeout)
                    .then(()=>{

                        // The changes settled to the database
                        super.commit().then(resolve, reject);

                        // Refresh the data after successful commit
                        this.refresh();

                    }, onReject);
            }).catch(error=>this._trigger("error", [error, "commit"]));
        }
    }

    _destroy(){
        this.setSubscribe( false );
    }

    static filter2query( filter ){
        if ( filter[0] === "and" || filter[0] === "or"){
            return `${ filter[0] }(${ filter[1].map( f => this.filter2query( f ) ).join(",") })`;
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

    static async transaction(DBs, changes, connection, timeout ){

        changes = Object.entries(changes);
        if (!changes.length) return "ok";

        let updates = [];

        for(const [id,[actual, prev]] of changes){
            if(actual && !prev){
                updates.push( this.create( this.encodeFields(actual) ) );
            }else if(!actual && prev){
                updates.push( this.remove( id, DBs ) );
            }else{
                let changedFields = diff( prev, actual);
                if (changedFields){
                    changedFields = patch2value(changedFields, 0);
                    updates.push( this.update( id, this.encodeFields(changedFields), DBs ) );
                }
            }
        }

        updates = updates.length === 1 ? updates[0] : ["TRANSACTION_START",...updates,"TRANSACTION_COMMIT"].join(";");

        return await this.query(connection, updates, timeout );
    }

    static query(connection, statement, timeout ){
        return new Promise((resolve, reject)=>{
            connection.query(statement, resolve, reject, timeout);
        })
    };

    static encodeFields( fields ){
        return Object.entries(fields).map(([f,v])=> {
            v = v === undefined
                ? null
                : typeof v === "string" || typeof v === "number"
                    ? v
                    : JSON.stringify(v);
            return ItemController.toSafeFieldName( f ) +"='"+ v +"'";
        } ).join(",");
    }

    static create( fields ){
        return `insert ${ fields } format $from_json`;
    }

    static update(id, fields ,DBs){
        return `set ${ fields } in ${ DBs } where .oid=$oid('${ id }') format $from_json`;
    }

    static remove( id, DBs ){
        return `delete from ${ DBs } where .oid=$oid('${ id }')`;
    }
}
Controller.extend();
