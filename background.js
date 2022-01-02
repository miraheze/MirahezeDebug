/**
 * Copyright 2015, 2016 Ori Livneh <ori@wikimedia.org>
 *
 * Licensed under the Apache License, Version 2.0 ( the "License" );
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var debug = {

    // The HTTP header we inject.
    getHeader: function () {
        return {
            name  : 'X-Miraheze-Debug',
            value : debug.backend,
        };
    },


    // We intercept requests to URLs matching these patterns.
    urlPatterns: [
        '*://*/*',
    ],

    // Current state: if true, inject header; if not, do nothing.
    enabled: false,

    // To which backend shall the request go to?
    backend: 'test101.miraheze.org',

    // Toggle state.
    toggle: function ( state ) {
        debug.enabled = state;
        debug.updateIcon();
        if ( debug.enabled ) {
            chrome.alarms.create( 'autoOff', { delayInMinutes: 15 } );
        }
    },

    // Dim the toolbar icon when inactive.
    updateIcon: function () {
        var path = debug.enabled ? 'icon_38_on.png' : 'default.png';
        chrome.browserAction.setIcon( { path: path } );
    },

    // Inject header when active.
    onBeforeSendHeaders: function ( req ) {
        if ( debug.enabled ) {
            req.requestHeaders.push( debug.getHeader() );
        }
        return { requestHeaders: req.requestHeaders };
    },

    // Automatic shutoff.
    onAlarm: function ( alarm ) {
        if ( alarm.name === 'autoOff' ) {
            debug.toggle( false );
        }
    },

    onMessage: function ( request, sender, sendResponse ) {
        if ( request.action === 'set' ) {
            debug.toggle( request.enabled );
            debug.backend = request.backend;
        } else if ( request.action === 'get' ) {
            sendResponse( {
                action: 'state',
                enabled: debug.enabled,
                backend: debug.backend,
            } );
        }
    }
};

chrome.runtime.onMessage.addListener( debug.onMessage );

chrome.alarms.onAlarm.addListener( debug.onAlarm );

chrome.webRequest.onBeforeSendHeaders.addListener( debug.onBeforeSendHeaders,
    { urls: debug.urlPatterns }, [ 'blocking', 'requestHeaders' ] );
