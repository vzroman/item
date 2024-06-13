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
import {Controller} from "../controllers/item.js";
import {Controller as collectionController} from "../controllers/collection.js"
import { view as views } from "./index.js";
//import $ from "jquery";


export class View extends Item{

    static options = {
        $container:{type:types.primitives.Any,required:true, virtual:true },
        enable:{type:types.primitives.Bool, virtual:true},
        visible:{type:types.primitives.Bool, default:true, virtual:true},
        focus:{type:types.primitives.Bool, default:false, virtual:true},
        classes:{type:types.primitives.Array},
        css:{type:types.primitives.Set, default:{}},
        widgets:{type:types.primitives.Set},
        waiting:{type:types.primitives.Fun},
        context_menu:{type: types.primitives.Any}
    };

    static events = {
        click:true,
        dblClick:true
    };

    static markup = undefined;

    markup(){
        return this.constructor.markup;
    }

    static widgets = {};

    widgets(){
        return this.constructor.widgets;
    }

    static getItem( $item ){
        return $item.data("@item");
    }

    #lockControllers;
    #pendingRequests;
    #unlock;

    constructor( options ){
        super( options );

        this.$markup = $( this.markup() ).appendTo( this._options.$container );
        this.$markup.data("@item", this);

        const widgets = this.widgets();

        // init widgets
        const $widgets = Object.keys( widgets ).reduce((acc,id)=>{
            let $container = this.$markup.find(`[name="${ id }"]`);
            if (!$container.length && this.$markup.attr("name") === id){
                $container = this.$markup;
            }
            if (!$container.length){
                console.warn("undefined container for widget", id);
            }else{
                acc[id] = $container;
            }
            return acc;
        },{});

        this._widgets = Object.entries($widgets).reduce((acc,[id, $container])=>{

            // Initialize the widget with default options
            let {view, options} = widgets[id];

            options = {
                data:this._options.data,
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
            if (typeof value === "boolean") this.enable( value );
        });

        //-------------------dynamic classes-----------------------------------------
        this.bind("classes",(actual = [], previous = [])=>{

            for (const c of previous){
                if (!actual.includes(c)) this.$markup.removeClass( c );
            }

            for (const c of actual){
                if (!previous.includes(c)) this.$markup.addClass( c );
            }
        });

        //-------------------handle css properties-----------------------------------
        const _css = this._options.css || {}; // accumulate controlled css
        this._controller.bind("beforeChange", changes =>{
            if (!changes.hasOwnProperty("css")) return;
            const css = changes.css || {};
            for (const [prop, val] of Object.entries( css ) ){
                if (val === null || val === undefined){
                    delete _css[prop];
                    delete css[prop]
                }else{
                    _css[prop] = val;
                }
            }
            // Add accumulated properties
            for (const [prop, val] of Object.entries( _css ) ){
                if (!css.hasOwnProperty(prop)) css[prop] = val;
            }
        });
        this.bind("css", (actual={}, previous={}) =>{
            const updates = {};
            for (const [prop, val] of Object.entries( actual ) ){
                if (previous[prop] !== val) updates[prop] = val;
            }
            for (const prop of Object.keys( previous ) ){
                if ( !actual.hasOwnProperty(prop) ) updates[prop] = '';
            }
            this.$markup.css(updates);
        });


        let _displayBackup = this.$markup.css("display");
        this._controller.bind("visible", value=>{
            // TODO. Or use visibility instead?
            // const visibility = value ? "inherit" : "hidden";
            // this.$markup.css({visibility});

            if (!value){
                _displayBackup = this.$markup.css("display");
                this.$markup.css({display:"none"});
            }else{
                this.$markup.css({display:_displayBackup});
            }
        });

        // Click and double click events
        let timer = undefined;
        this.$markup.on("click",event => {
            if (timer){
                clearTimeout( timer );
                timer=undefined;
                this._trigger("dblClick", event);
            }else {
               timer=setTimeout(()=>{
                    clearTimeout(timer);
                    timer=undefined;
                   this._trigger("click", event);
                },200);
            }
        });

        //Context menu event
        if(this._options.context_menu){
            this.$markup.on("contextmenu", (event) =>{
                event.preventDefault()
                const {x, y} = this.getClientPosition(event)
                this.contextmenu?.destroy();
               this.contextmenu = new ContextMenuWrapper({
                    $container: this._options.$container,
                    item: this.get(),
                    context_menu: this._options.context_menu,
                    css: {
                        "left": `${x}px`,
                        "top": `${y}px`,
                        "position":"absolute",
                        "border":"2px solid black",
                        "width":"200px",
                        "height":"200px",
                        "background":"red"
                    },
                })
                setTimeout(() => {
                    $("body").on("click.test contextmenu.test", () => {
                        this.contextmenu?.destroy();
                        $("body").off("click.test contextmenu.test");
                    })
                })
                console.log(this.get("data")?.get(".name"));
            });

            
        }

        const dependControllers = {};
        for (const o of Object.keys(this.constructor.options)){
            const value = this._options[o];
            if (value && value instanceof Controller){
                dependControllers[o] = value;
            }
        }

        this.#bindLock( dependControllers );
    }

    link( context ){

        context = this.linkContext( context );

        // Init own links and events to the external data
        super.link( context );

        this.#bindLock( context );

        this.linkWidgets( context );
    }

    linkWidgets( context ){

        if (!this._widgets) return;

        context = {
            ...context,
            ...{
                widgets:this._widgets,
                parent:this
            },
        };

        // Link the widgets to the external data
        Object.values(this._widgets).forEach(widget=>{
            widget.link( context );
        });
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
        if ( this._widgets){
            Object.values(this._widgets).forEach(widget =>{
                widget.set({enable:value});
            });
        }
    }

    #bindLock( context ){

        // check if the view item is lockable
        if (typeof this._options.waiting !== "function") return;

        this.#lockControllers = this.#lockControllers ?? {};

        for (const [key, controller] of Object.entries(context)){

            // the controller is already linked
            if (this.#lockControllers[key]) continue;

            // Check if the controller is lock linkable
            if (!(controller instanceof Controller)) continue;
            if (!controller.constructor.options.request) continue;

            // lock the item on request start
            const requestId =  controller.bind("$.request", request=>this.#onRequest( key, request ));

            const destroyId = controller.bind("destroy", ()=> this.#onRequest(key));

            this.bind("destroy",()=>{
                controller.unbind( destroyId );
                controller.unbind( requestId );
            });
         }
    }

    #onRequest( key, request ){
        if (this.isDestroyed()) return; // Already destroyed

        this.#pendingRequests = this.#pendingRequests ?? {};

        if (request?.then){
            this.#pendingRequests[ key ]=true;
            request.finally(()=>{
                this.#onRequest( key );
            });
        }else{
            delete this.#pendingRequests[ key ];
        }

        const isLocked = Object.keys( this.#pendingRequests ).length > 0;

        this.#lock( isLocked );
    }

    #lock( value ){
        if (value && !this.#unlock){
            const waitPromise = new Promise((resolve)=>this.#unlock = resolve);
            this._options.waiting( waitPromise );
        }else if( !value && this.#unlock ){
            this.#unlock();
            this.#unlock = undefined;
        }
    }

    getClientPosition(e){
        let x
        let y

        if(!e) e = window.event
        if(e.pageX || e.pageY){
            x = e.pageX
            y = e.pageY
        }else if(e.clientX || e.clientY){
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return {x,y}
    }

    _destroy(){

        this.#lockControllers = undefined;
        this.#pendingRequests = undefined;
        if (this.#unlock) this.#unlock();
        this.#unlock = undefined;

        if (this._widgets){
            Object.values(this._widgets).forEach(widget =>{
                widget.destroy();
            });
            this._widgets = undefined;
        }
        this.$markup.remove();
        this.$markup = undefined;
        super._destroy();
    }
}
View.extend();

class ContextMenuWrapper extends View{

    static options = {
        item: { type: types.primitives.Set, default: {} },
        context_menu:{type: types.primitives.Array, default: [] }
    }

    static markup = `<div name="context_menu">
        <div name="items"></div>
    </div>`

    widgets(){
        const controller = new collectionController({
            schema:{ 
                icon:{ type: types.primitives.String }, 
                caption:{type: types.primitives.String},
                handler:{type: types.primitives.Fun}
            },
            data:this._options.context_menu
        })

        return {
            items: {
                view: views.collections.Flex,
                options: {
                    data: controller,
                    item: {
                        view: MenuItem,
                        options: {
                            events:{}
                        }
                    }
                }
            }
        }
    }
}
ContextMenuWrapper.extend()

class MenuItem extends View {

    markup(){
        return `<div style="display: flex">
            <div name="icon"></div>
            <div name="caption"></div>
        </div>`
    }
    widgets() {
        return {
            icon:{
                view: views.primitives.Html,
                options:{
                    links:{
                        html:{source:"data@icon", handler: (icon) =>{ return `<img src="${icon}" alt="Не прогрузился">`}}
                    }
                }
            },
            caption:{
                view: views.primitives.Label,
                options:{
                    links:{
                        text:{source:"data@caption"}
                    }
                }
            }
        }
    }
}
MenuItem.extend();