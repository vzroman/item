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
import { controls } from "./index.js";
import {View as Flex} from "../collections/flex.js";
import {View as ItemView} from "../item.js";
import { controllers } from "../../controllers";
import UpIcon from "../../../src/img/arrow_up.png";
import DownIcon from "../../../src/img/arrow_down.png";
import DeleteIcon from "../../img/delete.png";


export class Control extends Parent{
    static options = {
        item: {type: types.primitives.Any},
        value: {type: types.primitives.Array, default: []}
    }

    static markup = `<div name="items"></div>`;

    updateValue( value ) {
        const set = Object.keys(this.itemcontroller.get()).reduce((acc,_,i) => {
            acc[i] = null;
            return acc;
        }, {});
        let i = 0;
        for (; i < value.length; i++){
            set[i] = { index: i, value: value[i], isUp: true, isDown: true, isDelete: true };
        }
        set["0"] = { index: 0, value: value[0], isDown: i > 1, isUp: false, isDelete: true };
        if (i > 1) {
            set[i - 1] = { index: i - 1, value: value[i - 1], isDown: false, isUp: true, isDelete: true };
        }
        this.itemcontroller.set(set);
        this.itemcontroller.set({[value.length]: {index: value.length, value: null, isDelete: false, isUp: false, isDown: false}});
    }

    widgets(){
        this.itemcontroller = new controllers.Collection({
            index:"index",
            schema:{
                index:{ type: types.primitives.Integer },
                value:{type: types.primitives.Any},
                isDelete:{type: types.primitives.Bool, default: true},
                isUp:{type: types.primitives.Bool, default: true},
                isDown:{type: types.primitives.Bool, default: true},
            },
            keyCompare:([a],[b])=>{
                a = +a;
                b = +b;
                if ( a > b ) return 1;
                if ( a < b ) return -1;
                return 0;
            },
            data:[]
        });

        this.$markup.find(".flex-collection").css({"gap": "8px"});

        return {
            items: {
                view: Flex,
                options: {
                    data: this.itemcontroller,
                    direction:"vertical",
                    item: {
                        view: ListItem,
                        options: {
                            item: this._options.item,
                            links: {
                                value: "data@value",
                                index: "data@index",
                            },
                            events: {
                                onDelete: {handler: index => {
                                    const value = this.get("value");
                                    if (value.length === 1){
                                        this.set({value: []});
                                    } else {
                                        value.splice(index, 1);
                                        this.set({value});
                                    }
                                }},
                                onReorder: {handler: (from, to) => {
                                    const value = this.get("value");
                                    [ value[from], value[to] ] = [value[to], value[from]];
                                    this.set({value});
                                }},
                                value: (value, prev, controller, {self})=>{
                                    if (!value) return;
                                    const val = this.get("value");
                                    val[self._options.index] = value;
                                    this.set({value: val});
                                }
                            },
                        }
                    }
                }

            }
        }
    }
}
Control.extend();

class ListItem extends ItemView{

    static options = {
        item:{type: types.primitives.Any},
        value:{type: types.primitives.Any},
        index:{type: types.primitives.Integer},
        isDelete:{type: types.primitives.Bool, default: true},
        isUp:{type: types.primitives.Bool, default: true},
        isDown:{type: types.primitives.Bool, default: true},
    }

    static events = {
        onDelete: true,
        onReorder: true
    }

    static markup = `<div style="display: flex;">
        <div name="content" style="flex-grow: 1"></div>
        <div style="margin-left: 12px;display: flex;align-items: center; gap: 6px;">
            <div name="up"></div>
            <div name="down"></div>
            <div name="delete"</div>
        </div>
    </div>`;

    widgets(){
        const { view, options } = this._options.item;
        return {
            content: {
                view,
                options: {
                    ...options,
                    links: {
                        ...options.links,
                        value: "parent@value"
                    },
                    events: {
                        ...options.events,
                        value: "parent@value"
                    }
                }
            },
            up: {
                view: controls.Button,
                options: {
                    icon: `url("${UpIcon}")`,
                    links:{
                        enable: "data@isUp",
                        css: { source: "data@isUp", handler: v => ({opacity: v ? 1 : 0.5})}
                    },
                    events: {
                        click: { handler: () => this._trigger("onReorder", [this._options.index, this._options.index-1]) }
                    }
                }
            },
            down: {
                view: controls.Button,
                options: {
                    icon: `url("${DownIcon}")`,
                    links:{
                        enable: "data@isDown",
                        css: {source: "data@isDown", handler: v => ({opacity: v ? 1 : 0.5})}
                    },
                    events: {
                        click: { handler: () => this._trigger("onReorder", [this._options.index, this._options.index+1]) }
                    }
                }
            },
            delete: {
                view: controls.Button,
                options: {
                    icon: `url("${DeleteIcon}")`,
                    links:{
                        enable: "data@isDelete",
                        css: { source: "data@isDelete", handler: v => ({opacity: v ? 1 : 0.5})}
                    },
                    events: {
                        click: { handler: () => this._trigger("onDelete", [this._options.index]) }
                    }
                }
            }
        }
    }
}
ListItem.extend();