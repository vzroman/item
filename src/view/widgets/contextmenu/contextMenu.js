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
        items:{type: types.primitives.Array, default: [] },
        x:{type: types.primitives.Float },
        y:{type: types.primitives.Float },
    };

    constructor(options){
        super(options);
        setTimeout(() => {
            this.check_overflow();
        })
    }

    markup(){
        const { x, y } = this._options;
        const $markup = $(`<div name="wrapper" class="${styles.wrapper}">
            <div name="context_menu" style="top:${y}px;left:${x}px;" class="${styles.menu}">
                <div name="items" style="padding:4px;"></div>
            </div>
        <div>`);
        $markup.on("click mousedown", () => {
            this.destroy();
        });
        this.$contextmenu = $markup.find('[name="context_menu"]');
        this.$contextmenu.on("click mousedown", (e) => {
            e.stopPropagation();
        });
        return $markup;
    };

    widgets(){
        const controller = new Collection({
            schema:{ 
                icon:{ type: types.primitives.String }, 
                caption:{type: types.primitives.String},
                handler:{type: types.primitives.Fun},
                enable:{type: types.primitives.Fun},
            },
            data:this._options.items
        });

        return {
            items: {
                view: views.collections.Flex,
                options: {
                    data: controller,
                    item: {
                        view: MenuItem,
                        options: {
                            links:{ classes: {source: "data@enable", handler: (enable=()=>{}) => {
                                return enable() ? [] : [ styles.disabled ];
                            }}},
                            events:{
                                click:(e, item) => {
                                    const handler = item.get("data").get("handler");
                                    handler();
                                    this.destroy();
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    check_overflow(){
        const total_width = this._options.$container.offset().left + this._options.$container.width();
        const total_height = this._options.$container.offset().top + this._options.$container.height();
        const if_overflow_x = (this._options.x + this.$contextmenu.width()) > total_width;
        const if_overflow_y = (this._options.y + this.$contextmenu.height()) > total_height;

        if (if_overflow_x){
            this.$contextmenu.css({"left": this._options.x - this.$contextmenu.width()});
        }
        if (if_overflow_y){
            this.$contextmenu.css({"top": this._options.y - this.$contextmenu.height()});
        }
    }
}

ContextMenu.extend();


class MenuItem extends ItemView {

    static markup = `<div class="${styles.menuitem}">
        <div name="icon" style="width:20px; height:20px;display:flex;align-items:center;justify-content:center;"></div>
        <div name="caption"></div>
    </div>`

    widgets() {
        return {
            icon:{
                view: views.primitives.Html,
                options:{
                    links:{
                        html:{source:"data@icon", handler: icon => icon ? `<img width="18" src="${icon}">` : `<div style="width:20px;"></div>`}
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
