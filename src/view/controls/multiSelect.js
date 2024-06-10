//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2023 vzroman
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

import {Control} from "./control.js";
import {types} from "../../types/index.js";
import { SelectList } from "./selectList.js";
import {View as Flex} from "../collections/flex.js";
import {View as ItemView} from "../item.js";
import { controllers } from "../../controllers";
import { controls } from "./index.js";
import { Label } from "../primitives/label.js";

import dropdown from "../../img/dropdown.svg"
import close from "../../img/close.svg"

import styles from "./multiSelect.css";

export class MultiSelect extends Control{
    static markup = `<div class="${ styles.multiselect }" name="multiselect_container">
        <div class="${styles.selected_items}" name="selected_items">
            <div name="selected"></div>
            <div name="items"></div>
        </div>
        <div name="toggle"></div>
    </div>`;

    static options = {
        value:{type: types.primitives.Array, default:[]},
        size:{type: types.primitives.Integer},
        items:{type: types.primitives.Any},
        itemValue:{type: types.primitives.String},
        itemText:{type: types.primitives.Any},
        itemGroup:{type: types.primitives.Any},
        isExpanded:{type: types.primitives.Bool, default: false}
    }

    constructor( options ){
        super( options );

        const _items = new Map();

        const _id = this._options.itemValue || "value";
        const _text = this._options.itemText || _id;

        const selectedController = new controllers.Collection({
            id:"id",
            schema:{
                id:{type: types.primitives.Any} ,
                text:{type: types.primitives.String}
            },
            data: []
        });

        const updateSelectedController=()=>{
            
            selectedController.set( Object.fromEntries( [..._items.keys()].map(id => [id, null]) ) );
            
            const value = this.get("value") || [];
            for (const v of value){
                selectedController.set({[v]:{id:v, text:_items.get(v)}} );
            }
        }

        const updateItems = (items)=>{
            if (typeof items[0] !== "object"){
                // The data is a simple list of values, transform it to the list of items
                items = items.map( value => { return {value} });
            }
            _items.clear();
            for (const item of items){
                _items.set( item[_id], item[_text] )
            }

            const value = this.get("value").filter(v => _items.has(v));
            this.set({value});
            updateSelectedController();
        }

        this.bind("value", updateSelectedController);

        this.bind("items", items=>{
            if (items instanceof controllers.Collection){
                items.onReady().then(()=> updateItems( Object.values( items.get() ) ) )
            }else{
                updateItems( items )
            }
        });

        this._widgets.selected.link({data:selectedController});
        
        
        this.bind("isExpanded", val => {
            if(val){
                $(document).on("click", (event) =>{
                    if(!event.target.closest('[name="multiselect_container"]')){
                        this.set({isExpanded: false})
                    }
                })
            }else{
                $(document).off("click", (event) =>{
                    if(!event.target.closest('[name="multiselect_container"]')){
                        this.set({isExpanded: false})
                    }
                })
            }
        })
    }

    widgets() {

        return {
            selected:{
                view:Flex,
                options:{
                    data: undefined,
                    direction:"horizontal",
                    item:{
                        view:SelectButton,
                        options:{
                            links:{ text:"data@text" },
                            events:{
                                onDelete:{
                                    handler: (id)=>{
                                        this.set({value: this._options.value.filter(val => val !== id)})

                                    }
                                },
                            }
                        }
                    }
                }
            },
            toggle:{
                view: controls.Button,
                options:{
                    icon:`url("${ dropdown }")`,
                    events:{
                        click:{handler:() => this.set({isExpanded: !this.get("isExpanded")})}
                    }
                }
            },
            items: {
                view: SelectList,
                options: {
                    visible: false,
                    value:this._options.value,
                    items:this._options.items,
                    itemValue:this._options.itemValue,
                    itemText:this._options.itemText,
                    links:{
                        value:"parent@value",
                        items:"parent@items",
                        itemValue:"parent@itemValue",
                        itemText:"parent@itemText",
                        visible:"parent@isExpanded"
                    },
                    events:{
                        value:"parent@value",
                    }
                }
            }
        }
    }

    unfold(){

    }

}
MultiSelect.extend();

class SelectButton extends ItemView{

    static events = {
        onDelete: true
    }

    static options = {
        text:{type: types.primitives.String}
    }

    static markup = `<div class="${styles.selectButton}">
        <div name="text"></div>
        <div name="close"></div>
    </div>`;

    widgets() {
        return {
            text:{
                view: Label,
                options:{
                    links:{text:"parent@text" }
                }
            },
            close:{
                view: controls.Button,
                options:{
                    icon:`url("${ close }")`,
                    events:{ click:{ handler:()=>{
                        this._trigger("onDelete", [this._options.data.get("id")]);
                    }}}
                }
            }
        }
    }
}
SelectButton.extend();

function unfold (event){
    // if(!event.target.closest($('#selected_items'))){
    //     this.set({isExpanded: false})
    // }
    console.log(event);
    console.log(event.target)
}