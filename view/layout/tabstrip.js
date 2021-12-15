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

import {View as Parent} from "../view.js";
import {view} from "../index.js";
import {types} from "../../types/index.js";

// Tabs example
// [
//     {
//         text: fp_dev.text("My tab"),
//         icon: "./my_icon.png",
//         widget: {view:MyView, ...viewOptions}
//     }
// ]

export class Layout extends Parent{
    static options = {
        tabs:{ type:types.Any },
        active:{type:types.Integer, default:0}
    };

    markup(){
        return `<div class="vertical" style="height: 100%">
            <div>
                <div name="menu"></div>
            </div>
            <div name="tab" style="flex-grow: 1"></div>
        </div>`;
    }

    widgets(){
        return {
            menu: {
                widget: Menu,
                links:{
                    tabs:{ vars:"tabs", value:tabs =>{
                        return [...tabs].map(({icon, text}) => { return {icon, text} } )
                    }}
                },
                events:{
                    value: value=>{ this.set({ active: value }) }
                }
            },
            tab:{widget:Tab, links:{
                value:"active",
                tabs:{vars:"tabs", value: tabs =>{
                    return [...tabs].map(({widget}) => { return widget } )
                }}
            }}
        };
    }
}

class Menu extends Control{

    static schema = util.deepMerge(Parent.schema, {
        tabs:{type:types.Any },
        value:{type:types.Integer, default:0}
    });

    constructor( $container, options ){
        super($container, options);

        this._widget = this.$container.kendoTabStrip({
            dataTextField: "text",
            dataImageUrlField: "icon",
            select: e => {
                this.value( $(e.item).index() );
            }
        }).data("kendoTabStrip");

        this.bind("tabs", tabs =>{
            this._widget.setDataSource( [...tabs] );
        });

        this.bind("value",value => this._widget.select( value ));
    }
}

class Tab extends Control{

    static schema = util.deepMerge(Parent.schema, {
        tabs:{type:types.Any },
        value:{type:types.Integer, default:0}
    });

    constructor( $container, options ){
        super($container, options);

        this._tabs = [];

        this.bind("tabs", () =>{
            // Destroy initialized widgets
            this._tabs.forEach(t=> t.destroy());
            this.$container.empty();
        });

        this.bind("value",(i, prev) => {
            const tabs = this.get("tabs");
            if (!tabs[i]){
                console.warn("invalid tab index",i);
                return;
            }
            if (this._tabs[prev]){
                this._tabs[prev].$markup.detach();
            }
            if (this._tabs[i]){
                this._tabs[i].$markup.attach();
            }else{
                const {widget, ...options} = tabs[i];
                this._tabs[i] = new widget($('<div></div>').appendTo(this.$container), options );
            }
        });
    }

    destroy(){
        this._tabs.forEach(t => t.destroy());
        this._tabs = undefined;
        super.destroy();
    }

}
