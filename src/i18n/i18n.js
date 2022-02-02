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
import {lang as en} from "./en.js";

const languages = {
    en
};

let _language = "en";

export function getLanguage(){
    return _language;
}

export function setLanguage( language ){
    if (languages[language]){
        _language = language;
    }else{
        addLanguage( language, {} );
        setLanguage( language );
    }
}

export function addLanguage( language, dictionary ){
    languages[ language ] = dictionary;
}

export function removeLanguage( language ){
    delete languages[ language ];
}

export function addKey( key, value, language ){

    language = language || _language;

    if (languages[ language ]){
        languages[ language ][ key ] = value;
    }else{
        addLanguage( language, {});
        addKey( key, value, language );
    }
}

export function removeKey( key, language ){
    language = language || _language;
    if (languages[ language ]){
        delete languages[ language ][ key ];
    }
}

export function text( text, language ) {
    if (typeof text !== "string"){ return text }

    language = language || _language;

    if ( languages[language] === undefined ){
        return text;
    }else{
        return languages[language][text] || text;
    }

}

