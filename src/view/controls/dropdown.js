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

import {Control as Parent} from "./control.js";
import {types} from "../../types/index.js";
import {Controller} from "../../controllers/collection.js";
import styles from "./dropdown.css"
//import $ from "jquery";

export class Control extends Parent{

    static options = {
        value:{type: types.primitives.String},
        size:{type: types.primitives.Integer},
        items:{type: types.primitives.Any},
        itemValue:{type: types.primitives.Any},
        itemText:{type: types.primitives.Any},
        itemGroup:{type: types.primitives.Any},
        hideClear:{type: types.primitives.Bool, default: false}
    };

    static markup = `<div class="${ styles.dropdown }">
        <select></select>
        <span class="${ styles.clear }">x</span>
    </div>`;

    constructor( options ){
        super( options );

        this.$select = this.$markup.find("select");
        this.$reset = this.$markup.find("span");

        this._itemsController = undefined;
        this._subscription = undefined;

        this.bind("size", value =>{
            if (value){
                this.$select.prop("size",value);
            }else{
                this.$select.removeProp("size");
            }
        });

        this.bind("items", value=> this._initItemsController(value) );

        this.bind("change", changes=>{
            for (const p of ["itemText", "itemValue", "itemGroup"]){
                if (changes.hasOwnProperty(p)){
                    this._updateItems();
                    break;
                }
            }
        });

        this.$select.on("change",() => this.set({ value:this.$select.val() }));

        this.$reset.on("click", () => {this.set({ value: null }); } );
        this.bind("hideClear", val=>{
            if (val) {
                this.$reset.css({display: "none"});
            } else {
                this.$reset.on("click", () => {this.set({ value: null }); } );
            }
        });
    }

    updateValue( value, prev ){
        this.$select.val( value )
    }

    enable( value ){
        this.$select.prop('disabled', !value);
    }

    focus(){
        this.$select.focus();
    }

    _initItemsController( data ){

        this._destroyItemsController();

        if (data instanceof Controller){
            this._itemsController = data;
        }else if( Array.isArray(data) ){

            const itemValue = this._options.itemValue || "value";
            const itemText = this._options.itemText || itemValue;
            if (typeof data[0] !== "object"){
                // The data is a simple list of values, transform it to the list of items
                data = data.map( value => { return {value} });
            }

            if (typeof itemValue === "string" && typeof itemText === "string"){

                // The minimal schema is defined
                const schema = {
                    [itemValue]:{type: types.primitives.Any }
                };
                if (itemText !== itemValue){
                    schema[itemText] = {type: types.primitives.String }
                }

                this._itemsController = new Controller({ schema, data });
            }else{
                // At least one of the fields (value or text) is calculated with a function from the object
                const schema = data[0]
                    ? Object.keys(data[0]).reduce((acc,k)=>{
                        acc[k] = {type: types.primitives.Any }
                        return acc;
                     },{})
                    :{ value:{type: types.primitives.Any } };

                this._itemsController = new Controller({ schema, data });
            }
        }else{
            return this._initItemsController([]);
        }

        this._itemsController.onReady().then(()=>{
            if (this.isDestroyed()) return;
            this._updateItems();
        });

        this._subscription = this._itemsController.bind("change",()=> this._updateItems() );

        if (!(data instanceof Controller)){
            // If the controller is not external we do not need to keep the subscription id
            // because it will be destroyed with the Control
            this._subscription = undefined;
        }
    }

    _updateItems(){
        this.$select.empty();

        const itemValue = this._options.itemValue || "value";
        const itemText = this._options.itemText || itemValue;
        const itemValueFun = typeof itemValue === "function" ? itemValue : item => item[itemValue];
        const itemTextFun = typeof itemText === "function" ? itemText : item => item[itemText];

        const currentValue = this.getValue();
        this._itemsController.view().forEach(([id, item])=>{
            const value = ''+itemValueFun( item );
            const text = itemTextFun( item );
            const selected = value === currentValue ? "selected" : "";

            $(`<option value="${ value }" ${selected}>${ text }</option>`).appendTo( this.$select );
        });

        if (this.$select.val() !== currentValue) {
            this.updateValue(null);
            this.setValue( null );
        }

    }

    _destroyItemsController(){

        if (this._itemsController) {
            if (this._subscription !== undefined){
                // The controller is external we cannot destroy it, just unsubscribe
                this._itemsController.unbind( this._subscription );
                this._subscription = undefined;
            }else{
                // The controller is homemade, destroy it
                this._itemsController.destroy();
            }
        }
        this._itemsController = undefined;
    }

    _destroy(){
        this._destroyItemsController();
        super._destroy();
    }
}
Control.extend();
