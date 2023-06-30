//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2022 vzroman
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

import {View as Item} from "./item.js";
import {controllers} from "../controllers/index.js";
import {util} from "../utilities/index.js";
import {types} from "../types/index.js";

export class View extends Item{

    static options = {
        itemController: { type:types.complex.Item, options:{ schema:{
            controller:{ type:types.primitives.Class, options:{ class:controllers.Item }},
            options:{ type:types.primitives.Set }
        }}}
    };

    static events ={
        addItem:true,
        removeItem:true
    };

    constructor( options ){
        super( options );

        this._collection = undefined;
        this._items = {};
        this._subscriptions = [];
    }


    link( context ){

        context = this.linkContext( context );

        // Init own links and events to the external data
        super.link( context );

        this.linkItems( context );
    }

    linkItems( context ){

        const {data} = context;

        if (data && data instanceof controllers.Collection && data !== this._collection){

            this._collection = data;

            data.forEach( id => {
                this._items[id] = this._addItem( id );
            });

            const addId = data.bind("add", (id, prevId)=>{
                this._items[id] = this._addItem( id, prevId );
            });
            this._subscriptions.push(()=>data.unbind( addId ));

            const removeId = data.bind("remove", id=>{
                this._removeItem( id );
                delete this._items[id];
            });
            this._subscriptions.push(()=>data.unbind(removeId));

            const editId = data.bind("edit", (id, prevId)=>{
                this._editItem( id, prevId );
            });
            this._subscriptions.push(()=>data.unbind( editId ));
        }

        return context;
    }

    addItem( item ){
        const id = util.data.GUID();
        item = item || {};
        setTimeout(()=> this._trigger("addItem",[id, item]));
        return this._collection.set({ [id]: item });
    }

    _editItem( id, prevId ){
        
        const item = this.getItem( id );

        const prevItem = this.getItem( prevId );

        this._placeItem( item, prevItem );
    }

    _placeItem( item, prevItem ){
        if (prevItem){
            item.$markup.insertAfter( prevItem.$markup );
        }
        // TODO. If the previousItem is undefined then we need to put the item on the first position in the collection
    }


    _addItem( id, prevId ){

        const prevItem = this.getItem( prevId );

        const item = this.newItem( id, prevItem );

        // Link the item to the data
        const controller = this._collection.fork( id, this._options.itemController );
        item.link( {data:controller, parent:this} );

        return [item, controller];
    }

    newItem( id, prevItem ){
        // To be overridden
        throw new Error("not implemented");
    }

    removeItem( id ){
        setTimeout(()=> this._trigger("removeItem",id));
        return this._collection.set({ [id]:null });
    }

    _removeItem( id ){
        this._items[id][0].destroy();
        this._items[id][1].destroy();
    }

    getItem( id ){
        const [item] = this._items[id] || [];
        return item;
    }

    destroy(){
        if (this._items){
            Object.values(this._items).forEach(item =>{
                item[0].destroy();
                item[1].destroy();
            });
            this._items = undefined;
        }

        this._subscriptions.forEach(s => s());
        this._subscriptions = [];

        this._collection = undefined;

        super.destroy();
    }
}
View.extend();
