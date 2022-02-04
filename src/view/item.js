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

import {Item} from "../core/item.js";
import {types} from "../types/index.js";
import {deepMerge} from "../utilities/data.js";


export class View extends Item{

    static options = {
        $container:{type:types.primitives.Any,required:true, virtual:true },
        enable:{type:types.primitives.Bool, default:true, virtual:true},
        visible:{type:types.primitives.Bool, default:true, virtual:true},
        focus:{type:types.primitives.Bool, default:false, virtual:true},
        widgets:{type:types.primitives.Set}
    };

    static events = {
        click:types.primitives.Any
    };

    static markup = undefined;

    markup(){
        return this.constructor.markup;
    }

    widgets(){
        return {};
    }

    constructor( options ){
        super( options );

        this.$markup = $( this.markup() ).appendTo( this._options.$container );

        this._widgets = this.widgets();

        // init widgets
        const $widgets = Object.keys( this._widgets ).reduce((acc,id)=>{
            const $container = this.$markup.find(`[name="${ id }"]`);
            if (!$container.length){
                console.warn("undefined container for widget", id);
            }else{
                acc[id] = $container;
            }
            return acc;
        },{});

        this._widgets = Object.entries($widgets).reduce((acc,[id, $container])=>{

            // Initialize the widget with default options
            let {view, options} = this._widgets[id];

            options = {
                links:{
                    enable:{source:"parent", event:"enable"}
                },
                ...options
            };

            // If options for the widget are overridden
            if (this._options.widgets && this._options.widgets[id]){

                // update the widget with defined externally options.
                // IMPORTANT! New links and events for the widget also
                // come from somewhere
                options = deepMerge( options, this._options.widgets[id] );
            }

            acc[id] = new view({$container, id, ...options});
            return acc;
        },{});

        this._controller.bind("focus", value=>{
            if (value){
                this.focus();
                this.set({focus:false});
            }
        });

        this._controller.bind("enable", value=>{
            this.enable( value );
        });

        this._controller.bind("visible", value=>{
            const visibility = value ? "visible" : "hidden";
            this.$markup.css({visibility});
        });

        this.$markup.on("click",event => this._trigger("click", event) );
    }

    link( sources ){

        // Init own links and events to the external data
        sources = super.link( sources );

        this.linkWidgets( sources );

        return sources;
    }

    linkWidgets( sources ){

        sources = {...sources,parent:this};

        // Link the widgets to the external data
        if ( this._widgets ){
            Object.values(this._widgets).forEach(widget=>{
                widget.link( sources );
            });
        }

        return sources;
    }


    focus(){
        const options = this.constructor.options;
        for (let p in options){
            if (
                options[p].required
                && options[p].focus
                && this._widgets[ options[p].focus ]
                && this._options[p] === undefined){
                this._widgets[p].set({focus:true});
                break;
            }
        }
    }

    enable( value ){
        // override it
    }


    destroy(){
        if (this._widgets){
            Object.values(this._widgets).forEach(widget =>{
                widget.destroy();
            });
            this._widgets = undefined;
        }
        this.$markup.remove();
        super.destroy();
    }
}
View.extend();