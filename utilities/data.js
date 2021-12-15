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


export function deepMerge(target, source) {

    // null value resets the value in the target
    if ( source === null ){ return undefined }

    // If the source value is not an object it overrides the value in the target
    if ( isLeaf( source ) ){
        return deepCopy( target );
    }

    if ( isLeaf( target ) ){
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

        return O1 === O2;
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
            return [...value];
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
        if ( !deepEqual(Source[k], v) ){ acc[k] = [v, Source[k]] }
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
    Object.entries(P2).forEach(([k,[v0,v1]])=>{
        P1[k] = [ P1[k] ? P1[k][0] : v0, v1 ];
    });
}

export function patch2value( Patch, i ) {
    return Object.keys( Patch ).reduce( (acc, k)=>{
        acc[k] = Patch[k][i];
        return acc
    },{} );
}

export function isLeaf(value) {
    return (value === null)
        || (typeof value === "function")
        || Array.isArray( value )
        || !( value instanceof Object);
}