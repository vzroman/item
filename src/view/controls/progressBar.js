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
import styles from "./progressBar.css"

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        value:{type: types.primitives.Float, default:0},
        validate:{type:types.complex.Item, options:{schema:{
            min:{type: types.primitives.Float, default:0},
            max:{type: types.primitives.Float, default:100}
        }}},
    };

    static markup = `<div class=${styles.wrapper}>
        <div class="${styles.progressBar}">
            <div name="progressBar_fill" class="${styles.progressBar_fill}"></div>
        </div>
        <div name="progressBar_value" class="${styles.progressBar_text}"></div>
    <div/>`;

    constructor( options ){
        super( options );

        this.$progressBar_fill = this.$markup.find('[name="progressBar_fill"]');
        this.$progressBar_value = this.$markup.find('[name="progressBar_value"]');
    }

    updateValue( value, prev ){
        const percentage = this.getPercentage(value);
        this.$progressBar_fill.css("width", percentage + '%');
        this.$progressBar_value.text(percentage.toFixed(1) + '%');
    }

    // enable( value ){
    //     this.$markup.prop('disabled', !value);

    //     if (value){
    //         this.$markup.removeClass(styles.disabled);
    //     }else{
    //         this.$markup.addClass(styles.disabled);
    //     }
    // }

    focus(){
        this.$markup.focus();
    }

    getPercentage(value){
        const {min, max} = this.get("validate")
        return ((value - min)/(max - min)) * 100
    }
}
Control.extend();
