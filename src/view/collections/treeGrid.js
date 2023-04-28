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
import {View as Grid, GridRows, Row as GridRow, Pager} from "./grid";
import style from "./grid.css";


class CellPager extends Pager{

    constructor( options ) {
        super( options );

        this.bind("page", (val=1) => {
            this.cellPagination.text(val);
        })
        
    }

    
    onClick(event){
        const cur_page = this.get("page");
        const clickedChev = $(event.target).attr("data-chevron");
        const totalPages = Math.ceil(this.get("totalCount") / this.get("pageSize"));       
        if (clickedChev !== undefined) {       
            
            if (clickedChev === "next" && cur_page < totalPages) {                
                this.set({page: cur_page+1});
                               
            } else if (clickedChev === "prev" && cur_page !== 1) {              
                this.set({page: cur_page-1});
                
            } 
        }
               
    }
    markup() {
        const $hidden = super.markup();
        const $markup = $(`
            <div>
                <div style="display: none;" name="hidden_pager"></div>
                <div style="display: flex; flex-direction: row; column-gap: 5px; margin-right: 5px;"> 
                    <div data-chevron="prev" name="prev"> < </div>
                    <div name="cellPagination" style="color: red;">1</div>
                    <div data-chevron="next" name="next"> > </div>
                </div>
            </div>
        `);

        const cellPager = $markup.find('[name="hidden_pager"]');
        this.cellPagination = $markup.find('[name="cellPagination"]');
        $hidden.appendTo(cellPager);
        const currentPage = this.get("page");
        
        this.$next = $markup.find('[name="next"]');
        this.$prev = $markup.find('[name="prev"]');

        $markup.on("click", (event) => {
            this.onClick(event)
        })
        return $markup;
    }
}
CellPager.extend();

export class View extends Grid{

    static options = {
        ...super.options,
        isFolder:{type:types.primitives.Any},
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
                pager: this.get("pager")
            }
        }

        return widgets;
    }
}
View.extend();

class TreeRows extends GridRows{

    static options = {
        ...super.options,
        isFolder:{type:types.primitives.Any},
        getSubitems:{type:types.primitives.Any},
        pager:{type:types.primitives.Set}
    };


    constructor( options, depth=0, root=null ){
        super( options );
        this.depth = depth;
        this.root = root;
        if (this.root) {
            this.createPager();
        }
    }

    createPager() {
        this.pager = new CellPager({
            ...this._options,
            ...this.get("pager"),
            links: { page:"data@$.page", totalCount: "data@$.totalCount",pageSize:"data@$.pageSize" },
            events: { page:"data@$.page", pageSize: "data@$.pageSize" }
        });

        const _pager_cell = this.root.$markup.find('[name="pager"]');
        this.pager.$markup.appendTo(_pager_cell);
    }

    destroy(){
        this.$pagerWrapper?.remove();
        this.$pagerWrapper = undefined;
        this.pager?.destroy();
        this.pager = undefined;
        super.destroy();
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
            columns:this._options.columns,
            numerated:this._options.numerated,
            selectable:this._options.selectable,
            depth:this.depth
        });
    }
}
TreeRows.extend();


class Row extends GridRow{

    static options = {
        ...super.options,
        isFolder:{type:types.primitives.Any},
        getSubitems:{type:types.primitives.Any},
        depth:{type:types.primitives.Integer, default: 0},
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
            this.$treeIcon.text(val ?  "-" : "+");
        })
    }

    appendColumns( $markup ) {
        const { depth, isFolder=()=>{}, id } = this._options;
        this._options.columns.forEach((_,i)=> {
            if (i === 0) {
                $(` <td style="position: relative;">
                        <div style="margin-left: ${20 * depth}px;" class="${style.first_cell}">
                            <div style="display: ${isFolder(id) ? "flex" : "none"};" name="tree-icon">+</div>
                            <div name="pager"></div>                        
                            <div name="${ i }" style="flex-shrink: 0;"></div>                            
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
