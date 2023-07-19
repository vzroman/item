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

export class Selection{
    constructor( options ) {

        this._selection = new Set();

        options.selection = this._selection;

        if ( options.multiselect ){
            this._onDestroy = multiSelect( options );
        }else{
            this._onDestroy = simpleSelect( options )
        }
    }

    selected( $selected ){
        const selection = this._selection;
        if ($selected){
            selection.clear();
            $selected.each(function(){ selection.add( this ) })
        }else{
            return [...selection]
        }
    }

    destroy(){
        this._onDestroy();
    }


}

function simpleSelect( options ){
    const {
        $container,
        $selector,
        selection,
        onSelect
    } = options;


    $container.on("click", (e)=>{
        const item = $(e.target).closest( $selector )[0];
        if (!item) return;

        const diff = {
            add:[], remove:[]
        }

        if (selection.has( item )){
            selection.delete( item );
            diff.remove.push( $(item) )
        }else{
            selection.add( item );
            diff.add.push( $(item) )
        }

        onSelect( diff );

    });

    return () => {}
}


function multiSelect( options ){


    const {
        $container,
        $selector,
        selection,
        onSelect
    } = options;


    const $lasso = $(`<div></div>`).css({
        "display": "none",
        "position": "absolute",
        "z-index": 9999,
        "background-color": "lightblue",
        "opacity": 0.3,
        "border": "1px dotted grey",
        "pointer-events":"none"
    }).appendTo('body');

    const start = {
        x:undefined,
        y:undefined
    };

    let fromIndex = undefined;

    const diff = {
        add:[],
        remove:[]
    };

    const startSelection = (e) => {
        const $item = $(e.target).closest( $selector );
        if (!$item.length) return;

        // Clear items that are not present already
        selection.forEach(i =>{
            if (!$container[0].contains(i)) selection.delete( i )
        });

        diff.add = [];
        diff.remove = [];

        if (!e.shiftKey) fromIndex = $container.children( $selector ).index( $item );

        if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
            diff.remove = [...selection].map( i => $(i));
            selection.clear();
        }

        start.x = e.pageX;
        start.y = e.pageY;

        $lasso.css({display:"block"});

        window.addEventListener('mousemove', onDraw);
        window.addEventListener('mouseup', endSelection);
    }

    const endSelection = (e)=>{

        $lasso.css({display:"none",width:0, height:0});
        window.removeEventListener('mousemove', onDraw);

        const $item = $(e.target).closest( $selector );

        const toIndex = $container.children( $selector ).index( $item );

        const $items = $container.children( $selector ).slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex)+1);

        $items.each(function (){
            if (selection.has( this )){
                if (e.ctrlKey || e.metaKey){
                    selection.delete( this );
                    diff.remove.push( $(this) );
                }
            }else{
                selection.add( this );
                diff.add.push( $(this) )
            }
        });

        fromIndex = toIndex;

        onSelect( diff );
    }

    const onDraw = e => {
        if (e.buttons !== 1) return endSelection(e);

        const width = e.pageX - start.x;
        const height = e.pageY - start.y;

        $lasso.css({
            width: Math.abs(width)+ "px",
            height: Math.abs(height)+ "px",
            left: (width < 0 ? e.pageX : start.x) + "px",
            top: (height < 0 ? e.pageY : start.y) + "px"
        });

    }

    $container.on("mousedown", startSelection);

    return ()=> $lasso.remove();

}


