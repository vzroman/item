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

import {types} from "../../types/index.js";
import {View as Grid, GridRows, Row as GridRow} from "./grid";
import style from "./grid/grid.css";



export class View extends Grid{

    static options = {
        ...super.options,        
        getSubitems:{type:types.primitives.Any}        
    };

    widgets(){
        const widgets = super.widgets();
        widgets.tbody = {
            view: TreeRows,
            options: {
                data: this._options.data,
                $container: this.$tbody,
                columns: this._options.columns,
                selectable:this._options.selectable,
                numerated:this._options.numerated,
                isFolder: this._options.isFolder,
                getSubitems: this._options.getSubitems,
                getIcon: this._options.getIcon
            }
        }

        return widgets;
    }
}
View.extend();

class TreeRows extends GridRows{

    static options = {
        ...super.options,        
        getSubitems:{type:types.primitives.Any},        
    };

    constructor( options, depth=0, root=null){
        super( options );
        this.depth = depth;
        this.root = root;
        this._options.data.bind("$.totalCount",value=>{
            if (this.root) {
                const text = this.formatTotalCount(value);
                this.root.$markup.find(`[name="nestedRows"]`).text(text);
            }
        })
    }

    formatTotalCount(value) {
        const _pageSize = this._options.data.option("pageSize");
        let _text = value > _pageSize ? `${value}` : "";
        const n = _text.length;

        if (n !== 0) {
            if(n > 6){
                _text = _text.substring(0, n - 6) + "kk...";
            } else if(n > 3){
                _text = _text.substring(0, n - 3) + "k...";
            } else if(n <= 3){
                _text = _text + "...";
            }
        }
        return _text;
    }

    getRoot() {
        return this.root;
    }

    newItem( id ){
        return new Row({
            id:id,
            $container: this._options.$container,
            isFolder:this._options.isFolder,
            getSubitems:this._options.getSubitems,
            getIcon:this._options.getIcon,
            columns:this._options.columns,
            numerated:this._options.numerated,
            selectable:this._options.selectable,
            depth:this.depth
        });
    }
    destroy(){
        if(this.root){
            this.root.$markup.find(`[name="nestedRows"]`).text("");
        }
        super.destroy();
    }
}
TreeRows.extend();


class Row extends GridRow{

    static options = {
        ...super.options,                
        depth:{type:types.primitives.Integer, default: 0},
        getSubitems:{type:types.primitives.Any},
        isOpen:{type:types.primitives.Bool, default: false}  
    };
    
    static events = {
        click: (event, _this, { data }) => {
            if ($(event.target).attr("name") === "tree-icon") {
                event.stopPropagation();
                _this._options.isOpen ? _this.close() : _this.open( data );
            }
        }
    }

    constructor( options ) {
        super( options );
        this.bind("isOpen", (val=false) => {
            this.$treeIcon.text(val ?  "-" : "+")
        })
       
        this.bind("data", data =>{
            if(data && typeof this._options.isFolder === 'function'){
                const _plus = this._options.isFolder(data.get());
                this.$treeIcon.toggleClass(style.treeIcon_visible, _plus);
            }
        })
    }

      
    appendColumns( $markup ) {
        const {depth} = this._options;
        this._options.columns.forEach((_,i)=> {
            if (i === 0) {
                $(`<td>
                        <div style="margin-left: ${20 * depth}px;" class="${style.first_cell}">
                            <div name="tree-icon">+</div> 
                            <div name="icon" class="${style.icon}"></div>                                                 
                            <div name="${ i }" style="flex-shrink: 0;"></div>
                            <div name="nestedRows" title="Quantity of nested rows"></div>
                        </div>
                    </td>`).appendTo($markup);
            } else {
                $(`<td name="${ i }"></td>`).appendTo($markup);
            }
        });
        this.$treeIcon = $markup.find(`[name="tree-icon"]`);
    }

    open( data ) {
        if (typeof this._options.getSubitems === "function") {
            this.set({isOpen: true});
            this._childrenController = this._options.getSubitems(data.get());
            this._children = new TreeRows({...this._options, data: this._childrenController}, this._options.depth+1, this);
        } else {
            throw new Error("Provide getSubitems method");
        }
    }
 
    close() {
        if (!this.get("isOpen")) {
            return;
        }
        this.set({isOpen: false});
        this.destroyChildren();
    }

    destroyChildren() {
        this._children?.destroy();
        this._children = undefined;
        this._childrenController?.destroy();
        this._childrenController = undefined;
    }
    destroy(){
        this.destroyChildren();
        super.destroy();
    }
}
Row.extend();
