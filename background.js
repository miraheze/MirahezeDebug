/**
 * Copyright 2015, 2016 Ori Livneh <ori@wikimedia.org>
 * Copyright 2022 Universal Omega <universalomega@miraheze.org>
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

    // Current state: if true, inject header; if not, do nothing.
    enabled: false,

    // To which backend shall the request go to?
    backend: 'test131.miraheze.org',

    // Toggle state.
    toggle: function ( state ) {
        debug.enabled = state;
        debug.updateIcon();
        if ( debug.enabled ) {
            chrome.alarms.create( 'autoOff', { delayInMinutes: 15 } );
        }
    },

    updateIcon: function () {
        if ( debug.enabled ) {
            chrome.action.setBadgeBackgroundColor( { color: '#447ff5' } );
            chrome.action.setBadgeText( { text: 'ON' } );
        } else {
            chrome.action.setBadgeText( { text: '' } );
        }
    },

    // Automatic shutoff.
    onAlarm: function ( alarm ) {
        if ( alarm.name === 'autoOff' ) {
            debug.toggle( false );
        }
    },

    onConnect: function ( port ) {
        port.onMessage.addListener( function ( request ) {
            if ( request.action === 'set' ) {
                debug.toggle( request.enabled );
                debug.backend = request.backend;
            } else if ( request.action === 'get' ) {
                port.postMessage( {
                    action: 'state',
                    enabled: debug.enabled,
                    backend: debug.backend,
                } );
            }
        } );
    },
};

chrome.runtime.onConnect.addListener( debug.onConnect );

chrome.alarms.onAlarm.addListener( debug.onAlarm );

chrome.declarativeNetRequest.onRequest.addRules( [
    {
        conditions: [
            new chrome.declarativeNetRequest.RequestMatcher( {
                url: { urlMatches: '*://*/*' },
            } ),
            new chrome.declarativeNetRequest.RequestMatcher( {
                extensionId: chrome.runtime.id,
                enabled: true,
            } ),
        ],
        actions: [
            new chrome.declarativeNetRequest.ModifyRequestHeader( {
                name: 'X-Miraheze-Debug',
                value: debug.backend,
            } ),
        ],
    },
] );
