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
import {Eventful} from "../core/eventful.js";

export class Controller extends Item{

    static options = {
        id:undefined,
        filter:undefined,
        orderBy:undefined,
        page:undefined,
        forkCommit:undefined
    };

    static events = {
        add:true,
        edit:true,
        remove:true,
        count:true,
        error:true
    };

    init( Data ){
        Data = this._coerce( Data );

        this._isRefresh = true;
        try{
            if (this._view) this._view.destroy();
            this._view = new util.AVLTree();
            this._data = {};
            this._count = 0;
            const changes = super.set( Data );
            this._data = util.patch(this._data, changes);
            this._changes = undefined;
            this._trigger("count", this._count);
        }finally {
            this._isRefresh = false;
        }
    }

    bind(event, callback){
        if ( this.constructor.events[event] ){
            return super.bind( event, callback );
        } else {
            // Unlike other types Controller subscribes
            // to the controlled item changes but not to it's own
            const id = Eventful.prototype.bind.call(this, event, callback);

            // The first event with actual value
            this._trigger(event, [this.get(event), undefined]);

            return id;
        }
    }

    fork( id, settings ){

        const data = this._get( id );
        if ( this._isRefresh || this._data[ id ] ){
            // This is an object edit operation
            // Add item id if it is not in the schema
            if (data && this._options.id && !data.hasOwnProperty( this._options.id )){
                data[ this._options.id ] = id;
            }
        }

        const {controller, options} = util.deepMerge({
            controller: Item,
            options:{
                autoCommit: true,
                schema: util.deepCopy( this._options.schema )
            }}, settings);

        const item = new controller( options );

        item.init(data||{});

        const parent = [this.bind(id, changes => {
            if (changes){
                item.set( changes )
            }else if(changes === null){
                item.destroy();
            }
        })];
        const child = [
            item.bind("change",changes => this.set({ [id]:util.patch2value(changes, 0) }))
        ];
        if (this._options.forkCommit === "refresh"){
            child.push( item.bind("commit",()=> this.refresh()) )
        }else if (this._options.forkCommit === "commit"){
            child.push( item.bind("commit",()=> this.commit( id )) )
        }

        // self-destroying bond
        parent.push(this.bind("destroy",() => child.forEach(id => child.unbind( id ))));
        child.push(item.bind("destroy",() => parent.forEach(id => this.unbind( id ))));

        return item;
    }

    get( id ){
        if ( !id ){
            return this.get( Object.keys({...this._data, ...this._changes}) );
        } else if (Array.isArray( id )) {
            const items = Linkable.prototype.get.call(this, id);
            for (const i in items){
                if (items[i]) items[i] = this._schema.get( items[i] );
            }
            return items;
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
            return this._promise("commit",(resolve, reject) => {

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
            });
        }
    }

    forEach( callback ){
        if (this._view){
            this._view.forEach(n => callback( n.key[1] ));
        }
    }

    view(){
        const data = [];
        this.forEach(id => data.push([id,this.get(id)]) );
        return data;
    }

    count(){
        return this._count;
    }

    destroy(){
        if (this._view){
            this._view.destroy();
            this._view = undefined;
        }
        super.destroy();
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

        Object.entries( changes ).forEach(([id,[item, previous]])=>{
            if ( previous === undefined ){
                this._view.insert([this._orderKey(id, item), id]);
                this._count++;
                this._trigger("add", [id, item]);
                this._trigger("count", this._count);
            }else if( item === null ){
                this._view.remove([this._orderKey(id, previous), id] );
                this._count--;
                this._trigger("remove", [id, previous]);
                this._trigger("count", this._count)
            }else{
                this._view.remove([this._orderKey(id, previous), id] );
                this._view.insert([this._orderKey(id, item), id]);
                this._trigger("edit", [id, item, previous]);
            }
        });

        super._onChange( changes );
    }

    _orderKey(id, item){
        let key = id;
        if ( this._options.orderBy ){
            if (item.hasOwnProperty(this._options.orderBy)){
                key = item[this._options.orderBy];
            }else{
                key = this._get(id)[this._options.orderBy];
            }
        }
        return key;
    }


}
Controller.extend();
