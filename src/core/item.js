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

import {Linkable} from "./linkable.js";
import {types} from "../types/primitives/index.js";
import {Controller} from "../controllers/item.js";
import * as errors from "../utilities/errors.js";

export class Item extends Linkable{

    // The options are described as attributes
    static options = {
        id:{type:types.String, virtual:true},
        links:{type:types.Set, virtual:true, default:{} },
        events:{type:types.Set, virtual:true, default:{} },
        data:{type: types.Instance, options:{class:Controller} }
    };

    static events = {};


    constructor( options ){
        super( options );

        // Options are linkable to data
        this._controller = new Controller({
            schema: this.constructor.options,
            data: options || {}
        });

        this._options = this._controller.get();

        if ( !this._options ){
            throw new errors.InvalidOptions(this.constructor, options);
        }

        this._controller.bind("change", changes => this._update( changes ));

        setTimeout(()=>{
            this.link({self:this, data:this._options.data});
        });
    }

    set( properties ){
        return this._controller.set( properties );
    }

    get( property ){
        return this._controller.get( property );
    }

    validate( properties ){
        return this._controller.validate( properties );
    }

    //-------------------------------------------------------------------
    // Link to external data
    //-------------------------------------------------------------------
    link( context ){

        const data = context?.data;

        context = this.linkContext( context );

        super.link( context );

        this._controller.link( context );

        if (data) this.set({data});
    }

    linkContext( context ){

        context = super.linkContext( context );

        if ( this._options.data ){
            context = {...context, data: this._options.data}
        }

        return context;
    }

    //-------------------------------------------------------------------
    // Events API
    //-------------------------------------------------------------------
    bind(event, callback){
        if (this.constructor.events[event]){
            // Subscriptions to own events overlap subscriptions controller events
            return [event, super.bind(event, callback)];
        } else{
            // Subscriptions to property changes
            return [event, this._controller.bind(event, callback)];
        }
    }

    unbind( [event,id] ){
        if (this.constructor.events[event]){
            super.unbind( id );
        } else if( this._controller ){
            this._controller.unbind( id );
        }
    }

    destroy(){
        this._controller.destroy();
        this._controller = undefined;
        super.destroy();
    }
}
Item.extend();
