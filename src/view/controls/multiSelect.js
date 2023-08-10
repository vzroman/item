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

import {Control as Parent} from "./control.js";
import {types} from "../../types/index.js";
import { SelectList } from "./selectList.js";
import {View as Flex} from "../collections/flex.js";
import {View as ItemView} from "../item.js";
import mainCss from "../../css/main.css";
import { controllers } from "../../controllers";
import { controls } from "./index.js";
import { Label } from "../primitives/label.js";
import close from "../../img/icons_cancel.svg"

export class MultiSelect extends Parent{
    static markup = `<div class="${ mainCss.multiselect }" style="height:42px;">
        <div class="${mainCss.toggle_wrapper}">
            <div name="selected" style="display:flex; flex-direction:row; overflow-x:scroll;"></div>
            <div name="toggle" style="text-align:center; margin-left:auto"></div>
        </div>
        <div style="position: absolute; top: 100%; width:100%;">
            <div name="items"></div>
        </div>
        
    </div>`;

    static options = {
        value:{type: types.primitives.Array, default:[]},
        size:{type: types.primitives.Integer},
        items:{type: types.primitives.Any},
        itemValue:{type: types.primitives.String},
        itemText:{type: types.primitives.Any},
        itemGroup:{type: types.primitives.Any},
        isExpanded:{type: types.primitives.Bool}
    }

    constructor( options ){
        super( options );
        const map = new Map();
        this._selectedController = new controllers.Collection({
            id:"id",
            schema:{ 
                id:{type: types.primitives.Any} ,
                text:{type: types.primitives.String}
            },
            data: []
        });

        this.bind("items", items => {
            map.clear();
            items.forEach(item => {
                item = typeof item === "object" 
                    ? {...item}
                    : {id: item};
    
                const id = this._options.itemValue 
                    ? item[this._options.itemValue]
                    : item.id;
                
                const text = this._options.itemText 
                    ? item[this._options.itemText]
                    : item.id;
                    
                map.set( id, {id, text} );
            });
            const value = this.get("value").filter(v => map.has(v));
            this.set({value});
        })

        this.bind("value",(value=[], prevValue=[])=>{
            for (const id of prevValue){
                if (!value.includes(id)) this._selectedController.set({[id]:null})
            }
            for (const id of value){
                this._selectedController.set({[id]:map.get(id)});
            }
        });

        this._widgets.selected.link({"data":this._selectedController});
    }

    widgets() {
        return {
            selected:{
                view:Flex,
                options:{
                    data: this._selectedController,
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
                    text: "V",
                    events:{
                        click:{handler:() => this._widgets.items.set({visible: !this._widgets.items.get("visible")})}
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
                    },
                    events:{
                        value:"parent@value",
                    }
                }
            }
        }
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

    static markup = `<div class="${mainCss.selectButton}">
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
                    events:{ click:{ handler:()=>{
                        this._trigger("onDelete", [this._options.data.get("id")]);
                    }}}
                }
            }
        }
    }
}
SelectButton.extend();