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
export {default as AVLTree} from "./avl/index.js";

export function deepMerge(target, source) {

    if ( source === null ){
        // null value resets the value in the target
        return undefined
    }else if(source === undefined){
        // There is nothing to merge with
        return deepCopy( target )
    }

    if ( isLeaf( target ) || isLeaf( source )){
        return deepCopy( source );
    }

    return Object.keys({...target, ...source}).reduce((acc,k)=>{
        acc[k] = deepMerge(target[k], source[k]);
        return acc;
    },{});

}

export function deepEqual(O1, O2) {

    const isLeaf1 = isLeaf( O1 ), isLeaf2 = isLeaf( O2 );

    if (isLeaf1 !== isLeaf2) { return false }

    if ( isLeaf1 ){
        if (Array.isArray(O1) && Array.isArray(O2)){
            if (O1.length !== O2.length){ return false }
            let eq = true;
            for (let i =0; i < O1.length; i++){
                if ( !deepEqual(O1[i],O2[i]) ){
                    eq = false; break;
                }
            }
            return eq;
        }

        return O1 === O2 || (
            ( O1===null || O1 === undefined )
            && ( O2===null || O2 === undefined )
        );
    } else {
        let eq = true;
        for (let k in {...O1,...O2}){
            if ( !deepEqual(O1[k],O2[k]) ){
                eq = false; break;
            }
        }
        return eq;
    }

}

export function deepCopy( value ){
    if (isLeaf(value)){
        if (Array.isArray(value)){
            return value.map( deepCopy );
        }else{
            return value
        }
    }else{
        return Object.entries(value).reduce((acc,[k,v])=>{
            acc[k] = deepCopy( v );
            return acc;
        },{});
    }
}

export function diff(Source, Changes){

    if (! (Source instanceof Object)){
        Source = {};
    }
    if (! (Changes instanceof Object)){
        Changes = {};
    }

    const result = Object.entries(Changes).reduce((acc,[k,v])=>{
        if ( !deepEqual(Source[k], v) ){
            // If the new value is undefined we replace it with null,
            // because the null explicitly claims that the value was reset
            acc[k] = [v !== undefined ? v : null , Source[k]]
        }
        return acc;
    },{});

    if (Object.keys(result).length === 0){
        return undefined;
    }

    return result;
}

export function patch(Data, Patch ) {
    if (! (Data instanceof Object)){
        Data = {};
    }
    if (! (Patch instanceof Object)){
        Patch = {};
    }
    return { ...Data, ...patch2value( Patch, 0 ) };
}

export function undo(Data, Patch ) {
    if (! (Data instanceof Object)){
        Data = {};
    }
    if (! (Patch instanceof Object)){
        Patch = {};
    }
    return { ...Data, ...patch2value( Patch, 1 ) };
}

export function redo(Data, Patch ) {
    if (! (Data instanceof Object)){
        Data = {};
    }
    if (! (Patch instanceof Object)){
        Patch = {};
    }
    return { ...Data, ...patch2value( Patch, 0 ) };
}

export function patchMerge(P1, P2) {
    if (! (P1 instanceof Object)){
        return P2;
    }
    if (! (P2 instanceof Object)){
        return P1;
    }
    const result = Object.keys({...P1,...P2}).reduce((acc, k)=>{
        if ( !P1[k] ){
            acc[k] = P2[k];
        }else if( !P2[k] ){
            acc[k] = P1[k];
        }else{
            if ( !deepEqual(P2[k][0], P1[k][1]) ) acc[k] = [ P2[k][0], P1[k][1] ];
        }
        return acc;
    },{});

    if (Object.keys(result).length === 0){
        return undefined;
    }

    return result;
}

export function patch2value( Patch, i ) {
    return Object.keys( Patch ).reduce( (acc, k)=>{
        acc[k] = Patch[k][i];
        return acc
    },{} );
}

export function isLeaf(value) {
    return !( value instanceof Object)
        || value.constructor !== Object
}

export function GUID() {
    let buf = new Uint32Array(4);
    window.crypto.getRandomValues(buf);
    let idx = -1;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
        idx++;
        let r = (buf[idx>>3] >> ((idx%8)*4))&15;
        r = c == 'x' ? r : (r&0x3|0x8);
        return r.toString(16);
    });
}