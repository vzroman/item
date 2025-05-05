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

import {View as Item} from "../../item.js";
import {types} from "../../../types/index.js"
import styles from "./drawer.css";

// The control is the point where external widgets to be attached
export class Drawer extends Item{

    static options = {
        view:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Item}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},
        isOpen:{type:types.primitives.Bool, default:false},
        minWidth:{type: types.primitives.String},
        width:{type:types.primitives.String}, //to receive any types of width as px, percentages or relative units
        z_index:{type: types.primitives.Integer, default:11002} 
    };
    
    static markup = `<div class="${styles.drawer}">
        <div name="view"></div>
    </div>`

    constructor(options){
        super(options);
        this.$drawer = this.$markup.find(`.${styles.drawer}`);
        this.bind("z_index",z_index=> {
            this.$drawer.css({"z-index":z_index});
        });
        this.bind("minWidth",minWidth=> {
            this.$markup.css({"min-width":minWidth});
        });
        this.bind("width",width=> {
            this.$markup.css({"width":width});
        });
        this.bind("isOpen", isOpen => this.expandDrawer(isOpen))
    }
    widgets(){
        return {
            view:this._options.view
        }
    }

    expandDrawer(isOpen){
        if(isOpen){
            this.$markup.addClass( styles.open );
        }else{
            this.$markup.removeClass( styles.open );
        }
    }
}
Drawer.extend();
