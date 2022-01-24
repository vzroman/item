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

import {View as Item} from "./item.js";
import {types} from "../types/index.js";

export class View extends Item{

    static options = {
        item:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Item}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},
        wrapper:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Item}, required:true },
            options:{type: types.primitives.Set }
        }}}
    };

    constructor( options ){
        super( options );

        this._items = {};
        this._subscriptions = [];
    }

    $itemsContainer(){
        return this.$markup;
    }

    link( sources ){

        // Init own links and events to the external data
        sources = super.link( sources );

        this.linkItems( sources );

        return sources;
    }

    linkItems( sources ){

        const {data} = sources;

        if (data){
            data.forEach( id => {
                this._items[id] = this.addItem( data.fork(id) );
            });

            this._subscriptions.push(data.unbind(data.bind("add", id=>{
                this._items[id] = this.addItem( data.fork(id) );
            })));

            this._subscriptions.push(data.unbind(data.bind("remove", id=>{
                this._items[id].destroy();
            })));
        }

        return sources;
    }

    addItem( data ){

        let item;
        if (this._options.wrapper){
            // The wrapper should create the item
            item = new this._options.wrapper.view({
                ...this._options.wrapper.options,
                $container:this.$itemsContainer(),
                item:this._options.item
            });
        }else{
            // No wrapper
            item = new this._options.item.view({
                ...this._options.item.options,
                $container:this.$itemsContainer()
            });
        }

        // Link the item to the data
        if (data){
            item.link( {data, parent:this} );
        }

        return item;
    }

    destroy(){
        if (this._items){
            Object.values(this._items).forEach(item =>{
                item.destroy();
            });
            this._items = undefined;
        }

        this._subscriptions.forEach(s => s());
        this._subscriptions = [];

        super.destroy();
    }
}
View.extend();