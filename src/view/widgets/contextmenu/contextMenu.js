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

import {View as ItemView} from "../../item.js";
import styles from "./contextMenu.css";
import {Controller as Collection} from "../../../controllers/collection";
import {view as views} from "../../index.js";
import {types} from "../../../types"

export class ContextMenu extends ItemView{

    static options = {
        context_data:{type: types.primitives.Array, default: [] },
        items:{type: types.primitives.Array}
    };

    static markup = `<div name="context_menu">
        <div name="items"></div>
    </div>`;

    constructor(options){
        super(options);           

        setTimeout(()=>{
            $("body").on("contextmenu click", (event) => {
                event.preventDefault();
                if(!event.target.closest('[name="context_menu"]')){
                    this.destroy()
                    $("body").off("contextmenu click");
                }
            })
        })
    }

    widgets(){
        const controller = new Collection({
            schema:{ 
                icon:{ type: types.primitives.String }, 
                caption:{type: types.primitives.String},
                handler:{type: types.primitives.Fun},
                isEnable:{type: types.primitives.Fun, default: ()=>{
                    return true
                }},
                items:{type: types.primitives.Array}
            },
            data:this._options.context_data
        })

                // We stop the event because we don't want the rows become selected
        // on click to contextmenu
        this.$markup.find('[name="items"]').on("mousedown mouseup", e=>{
            e.stopPropagation();
            e.preventDefault();
        })


        return {
            items: {
                view: views.collections.Flex,
                options: {
                    data: controller,
                    item: {
                        view: MenuItem,
                        options: {
                            links:{
                                isEnabled:{source: "data@isEnable", handler: (_callback) =>{
                                    return _callback(this._options.items)
                                }}
                            },
                            events:{
                                click:{handler:(e, item) =>{
                                    const contextEvent = item.get("data").get("handler")
                                    contextEvent(this._options.items);
                                    this.destroy()
                                }}
                            }
                        }
                    }
                }
            }
        }
    }
}

ContextMenu.extend();


class MenuItem extends ItemView {

    static options = {
        isEnabled: {type: types.primitives.Bool, default: true}
    }

    #disabledStyle = {
        color: "#9b9b9b", 
        opacity: "0.5"
    };

    constructor(options){
        super(options);

        const prevMarkupStyle = this.$markup.css(["color", "opacity"]);
        this.bind("isEnabled", value =>{
            if (value) {
                this.$markup.css({ "pointer-events": "unset", ...prevMarkupStyle});
            } else {
                this.$markup.css({ "pointer-events": "none", ...this.#disabledStyle });
            }
        })
    }

    markup(){
        return `<div class="${styles.menuitem}">
            <div name="icon" style="width:20px; height:20px; margin:3px 2px 4px 3px;"></div>
            <div name="caption"></div>
        </div>`
    }
    widgets() {

        [this.$markup.find('[name="icon"]'), this.$markup.find('[name="caption"]')].forEach((elem) =>{
            elem.on("mousedown mouseup", e=>{
                e.stopPropagation();
                e.preventDefault();
            })
        })

        return {
            icon:{
                view: views.primitives.Html,
                options:{
                    links:{
                        html:{source:"data@icon", handler: (icon) =>{ return `<img src="${icon}">`}}
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



