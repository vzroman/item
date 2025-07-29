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
import {Controller as Item} from "./item.js";
import {Linkable} from "../core/linkable.js";
import * as util from "../utilities/data.js";

function DEFAULT_COMPARE (a, b) { return a > b ? 1 : a < b ? -1 : 0; }

export class Controller extends Item{

    static options = {
        id:undefined,
        autoCommit:false,
        filter:undefined,
        orderBy:undefined,
        keyCompare:undefined,
        page:1,
        pageSize: undefined,
        totalCount: 0
    };

    static events = {
        add:true,
        edit:true,
        remove:true,
        count:true,
        error:true
    };

    constructor( options ) {
        super( options );

        this._pageItems = new Map();

        this.bind("$.pageSize",()=>{
            if (this.option("page") === 1){
                this.updatePage();
            }else{
                this.option("page", 1);
            }
        });

        this.bind("$.page",()=>{
            this.updatePage();
        });

        this.bind("$.filter", (filter, prevFilter)=>{
            if(!this._filter) return;
            if (filter === prevFilter) return;
            this.filter( filter, prevFilter );
        });

        this.bind("$.orderBy", (orderBy, prevOrderBy)=>{
            if(!this._view) return;
            if (orderBy === prevOrderBy) return;
            this.onReorder();
        });

        this.bind("$.keyCompare", (keyCompare, prevKeyCompare)=>{
            if(!this._view) return;

            if (keyCompare === prevKeyCompare) return;
            this.onReorder();
        });
    }

    #operatorAction = {
        "=": (a, b) => {
            return Object.is(a, b);
        },
        ">": (a, b) => {
            return a > b;
        },
        "<": (a, b) => {
            return a < b;
        },
        "like": (a, b) => {
            return a.includes(b);
        }
    };

    _checkByConditions(filter, item) {
        if (filter.length === 2) {
            const [logic, conditions] = filter;
            if (logic === "or") {
                return conditions.some((c) => this._checkByConditions(c, item));
            } else if (logic === "and") {
                return conditions.every((c) => this._checkByConditions(c, item));
            } else if (logic === "andnot") {
                const [and, not] = conditions;
                return this._checkByConditions(and, item) && !this._checkByConditions(not, item);
            } else {
                throw new Error(`undefined logic: ${logic}`);
            }
        } else {
            const [field, operator, value] = filter;
            const applyOperator = this.#operatorAction[operator];
            return applyOperator?.(item[field], value) ?? false;
        }
    }

    init( Data ){
        Data = this._coerce( Data );

        this._isRefresh = true;
        try{
            if (this._view) this._view.destroy();

            this._view = new util.AVLTree( this.compileComparator() );
            this._data = {};
            this._count = 0;
            const changes = super.set( Data );
            this._data = util.patch(this._data, changes);
            this._changes = undefined;
            this._trigger("count", this._count);
            this._onReady();
        }finally {
            this._isRefresh = false;
        }
    }

    filter(value) {
        if (value) {
            this._filter = this._checkByConditions.bind(this, value);
        } else {
            this._filter = undefined;
        }
        this.updatePage();
    }

    onReorder(){
        this._view.destroy();

        this._view = new util.AVLTree( this.compileComparator() );
        const data = this.get();

        for (const [id, item] of Object.entries(data)){
            this._view.insert(this._orderKey(id, item));
        }
        this._updateView();
    }

    fork( {id, params, isSource, isConsumer, onCommit} ){

        id = id || util.GUID();
        params = params || {};

        const data = this._get( id );
        if ( this._isRefresh || this._data[ id ] ){
            // This is an object edit operation
            // Add item id if it is not in the schema
            if (data && this._options.id && !data.hasOwnProperty( this._options.id )){
                data[ this._options.id ] = id;
            }
        }

        // Create the item controller
        const {controller, options} = util.deepMerge({
            controller: Item,
            options:{
                autoCommit: true,
                schema: util.deepCopy( this._options.schema )
            }}, params);

        const item = new controller( options );
        item.init(data||{});

        //------------Set the relations--------------------------------
        const parent = [];
        const child = [];

        // The item is a consumer of changes in the collection
        if (isConsumer) {
            parent.push(this.bind(id, changes => {
                if (changes){
                    item.set( changes )
                }else if(changes === null){
                    item.destroy();
                }
            }));
        }

        // The item is a source of changes in the collection
        if (isSource || onCommit){
            child.push( item.bind("commit",() => {
                if ( onCommit === "refresh" ){
                    this.refresh();
                }else{
                    this.set({ [id]:item.get() });
                    if ( onCommit === "commit"){
                        this.commit( id );
                    }
                }

            }))
        }

        // self-destroying bond
        parent.push(this.bind("destroy",() => child.forEach(id => item.unbind( id ))));
        child.push(item.bind("destroy",() => parent.forEach(id => this.unbind( id ))));

        return item;
    }

    get( id ){
        if ( !id ){
            const allItems = this.get( Object.keys({...this._data, ...this._changes}) );
            for (let i in allItems){
                if (!allItems[i]) delete allItems[i];
            }
            return allItems;
        } else if (Array.isArray( id )) {
            const items = Linkable.prototype.get.call(this, id);
            for (const i in items){
                // If the requested id is an option or item is undefined then return it as is
                if (i?.startsWith("$.") || !items[i]) continue;
                // Otherwise validate the item against the schema
                items[i] = this._schema.get( items[i] );
            }
            return items;
        }else if(id.startsWith("$.")){
            return Linkable.prototype.get.call(this, id);
        }else{
            let item = Linkable.prototype.get.call(this, id);
            if (item) item = this._schema.get( item );
            return item;
        }
    }

    commit( idList ){
        if ( idList === undefined) {
            return super.commit();
        }else if( !Array.isArray( idList ) ){
            return this.commit( [idList] );
        }else{
            return new Promise((resolve, reject) => {

                const onReject = error => {
                    this._trigger("reject", error);
                    return reject( error );
                }
                if ( !this._changes ) return onReject("no changes");

                const toCommit = idList.reduce((acc, id)=>{
                    acc[id] = this._changes[id];
                    return acc;
                },{});

                if ( !Object.keys( toCommit ).length ) return onReject("no changes");

                // Get a copy of changes
                const changes = util.deepCopy( this._changes );

                // Set only requested changes
                this._changes = toCommit;
                this.commit().then(result =>{

                    // The commit is successful, redeem not committed changes
                    idList.forEach(id => delete changes[id]);
                    this._changes = changes;

                    if ( this.isCommittable() ){
                        this._trigger("committable", true );
                    }

                    resolve( result )
                }, error =>{
                    // The changes are not committed, recover from the copy
                    this._changes = changes;
                    reject( error );
                })
            }).catch(error=>this._trigger("error", [error, "commit"]));
        }
    }

    _forEach( callback ){
        if (this._view){
            const { page, pageSize } = this._options;
            if (pageSize === undefined) {
                this._view.forEach(n => {
                    callback( n.key[1] );
                });
            } else {
                const startIndex = (page - 1) * pageSize;
                let n = this._view.at( startIndex );
                for (let i = 0; i < pageSize && n; i++) {
                    callback( n.key[1] );
                    n = this._view.next(n);
                }
            }
        }
    }

    forEach(callback) {
        let filter = callback;

        if (typeof this._filter === "function") {
            filter = (id) => {
                const meetsCondition = this._filter(this.get(id));
                if (meetsCondition) {
                    callback( id );
                }
            };
        }

        this._forEach( filter );
    }

    view(){
        const data = [];
        this._forEach(id => data.push([id,this.get(id)]) );
        return data;
    }

    getCount() {
        return this._view.size;
    }

    count(){
        return this._count;
    }

    _destroy(){
        if (this._view){
            this._view.destroy();
            this._view = undefined;
        }
        super._destroy();
    }

    refresh( data ){
        if ( data ) data = this._coerce( data );
        return super.refresh( data );
    }


    _coerce( Data ){
        if (this._options.id !== undefined){
            if (typeof Data === "object" && Data.constructor === Object){
                Data = Object.values( Data );
            }

            if( !Array.isArray( Data ) ){
                throw new Error("Invalid data");
            }

            Data = Data.reduce((acc, item)=>{
                const id = item[ this._options.id ];
                if (id !== undefined){
                    acc[ id ] = item;
                }else{
                    console.warn(`undefined ${ this._options.id } for item`, item);
                }
                return acc;
            },{});
        }else if(Array.isArray( Data )){
            Data = Data.reduce((acc, item, i)=>{
                acc[i] = item;
                return acc;
            },{});
        }else if(typeof Data !== "object"){
            throw new Error("Invalid data");
        }

        // Coerce items
        for (const k in Data){
            Data[k] = this._schema.coerce( Data[k] );
        }

        return Data;
    }

    _get( id ){
        if (typeof id === "string" && id.startsWith("$.")) {
            return super._get( id );
        }
        let item = this._data ? this._data[ id ] : undefined;

        // If item has uncommitted changes
        if ( this._changes && this._changes[ id ]){
            if ( this._changes[ id ][ 0 ]){
                // Item was changed or created
                item = {...item, ...this._changes[ id ][ 0 ]};
            }else{
                // Item was deleted
                item = this._changes[ id ][ 0 ];
            }
        }

        // Make a copy of the item
        if ( item ){
            item = util.deepCopy( item );
        }

        return item;
    }

    _set( items ){
        items = super._set_options( items );
        for (const id in items){
            
            if (items[id] === null){
                // The item is being deleted
                continue;
            }else if( items[id] === undefined ){
                // The item is not valid
                items[id] = false;
            }else{

                // Previous value
                const item = this._get( id );

                if ( !item ){
                    // Validate the item against the schema
                    items[ id ] = this._schema.coerce( items[id] );
                    continue;
                }else{
                    // Validate the item against the schema
                    items[ id ] = this._schema.set({...item, ...items[id]});
                }

                // The item is being added
                if ( !item ) continue;

                // Check for real changes
                const changes = util.diff( item, items[ id ] );
                if (!changes){
                    delete items[ id ];
                }else{
                    // Keep changes only
                    items[ id ] = util.patch( items[ id ], changes );
                }
            }
        }
        return items;
    }

    _validate(){
        let isValid = true;
        for (const id in this._changes){
            if ( this._changes[ id ][0] && !this.get( id ) ){
                isValid = false;
                break;
            }
        }
        return isValid;
    }

    _refresh( data ){
        Object.keys({...this._data,...this._changes}).forEach(id => {

            // The item doesn't exist anymore
            if (!data.hasOwnProperty(id)) data[id] = null;
        });

        return super._refresh( data );
    }

    _onChange( changes ){
        let isReordered = false;
        Object.entries( changes ).forEach(([id,[item, previous]])=>{
            if ( previous === null || previous === undefined ){
                this._view.insert(this._orderKey(id, item));
                isReordered = true;
            }else if( item === null || item === undefined ){
                isReordered = true;
                this._view.remove(this._orderKey(id, previous));
            }else{
                const prevKey = this._orderKey(id, previous);
                const actualKey = this._orderKey(id, item);
                isReordered = isReordered || (prevKey !== actualKey);
                this._view.remove( prevKey );
                this._view.insert( actualKey );
            }
        });
        if (isReordered) this._updateView();
        this.option("totalCount", this.getCount())

        super._onChange( changes );
    }

    _orderKey(id, item) {
        let key = id;

        let orderBy = this._options.orderBy;
        if (typeof orderBy==="string") orderBy = [[orderBy,"asc"]];

        if (Array.isArray(orderBy) && orderBy.length > 0) {
            key = {};

            orderBy.forEach(field => {
                const fieldName = Array.isArray(field) ? field[0] : field;
                if (item && item.hasOwnProperty(fieldName)) {
                    key[fieldName] = item[fieldName];
                } else {
                    const _item = this._get(id);
                    key[fieldName] = _item ? _item[fieldName] ?? null : null;
                }
            });
        }
    
        return [key, id];
    }
    
    
    updatePage() {
        this._updateView();
    }


    _updateView(){
        const newPageItems = new Map();
        let prevId = null;
        if (!this._pageItems) this._pageItems = new Map();
        this.forEach(id =>{
            if (!this._pageItems.has(id)) {
                this._trigger("add", [id, prevId]);
            }else {
                if (this._pageItems.get(id) !== prevId) {
                    this._trigger("edit", [id, prevId]);
                }
                this._pageItems.delete(id);
            }
            newPageItems.set( id, prevId );
            prevId = id;
        })
        for (const id of this._pageItems.keys()) {
            this._trigger("remove", [id]);
        }
        this._pageItems = newPageItems;
    }

    compileOrderByComparator() {
        let orderBy = this._options.orderBy;
        if (typeof orderBy === "string"){
            orderBy = [[orderBy,"asc"]];
        }else if (Array.isArray(orderBy)){
            if (typeof orderBy[0] === "string" && orderBy.length === 2 ){
                orderBy = [orderBy]
            }
        }else{
            orderBy = [];
        }
        const keyCompare = this._options.keyCompare ?? {};
        const compareSeq = [];

        for (let i=0; i < orderBy.length; i++){
            const [field, dir] = orderBy[i];
            const compareFun = keyCompare[field] ?? DEFAULT_COMPARE;
            const dirCompareFun = dir === "desc"
                ? (a, b)=> -compareFun(a, b)
                : compareFun;
            compareSeq.push([field, dirCompareFun]);
        }

        return (aItem, bItem)=>{
            let result = 0;
            for (let i=0; i<compareSeq.length; i++){
                const [field, compareFun] = compareSeq[i];
                result = compareFun( aItem[field], bItem[field] );
                if (result !== 0) break;
            }
            return result;
        };
    }
    compileComparator() {
        const orderByComparator = this.compileOrderByComparator();

        return (a, b)=>{
            const [aKey, aId] = a;
            const [bKey, bId] = b;
            let result = orderByComparator( aKey, bKey );
            if (result === 0){
                result = DEFAULT_COMPARE(aId, bId)
            }
            return result;
        }
    }
}
Controller.extend();
