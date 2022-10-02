/*:
-------------------------------------------------------------------------
@title Game Over Events
@author Hime --> HimeWorks (http://himeworks.com)
@date Feb 2, 2016
@version 1.2
@filename HIME_GameOverEvents.js
@url http://himeworks.com/2015/11/gameover-events-mv/

If you enjoy my work, consider supporting me on Patreon!

* https://www.patreon.com/himeworks

If you have any questions or concerns, you can contact me at any of
the following sites:

* Main Website: http://himeworks.com
* Facebook: https://www.facebook.com/himeworkscom/
* Twitter: https://twitter.com/HimeWorks
* Youtube: https://www.youtube.com/c/HimeWorks
* Tumblr: http://himeworks.tumblr.com/

-------------------------------------------------------------------------
@plugindesc v1.2 - Allows you to use events to set up a game over event.

@param Gameover Map ID
@desc ID of the map to send player to upon game over
@default 999
@help 
-------------------------------------------------------------------------
== Description ==

Video: https://www.youtube.com/watch?v=UZfjKUib0V0

Ever had a random encounter, but wanted to make it so that if the party
loses, instead of simply going to the game over scene, you could play
some custom events?

Or maybe you have a number of evented battles, but if the player loses,
the game over processing should all be handled the same way? Or perhaps
the same way as the random encounters?

This plugin allows you to create your very own gameover events!
Simply create a map, set up some events, and you're ready to show your
own gameover scene!

== Terms of Use ==

- Free for use in non-commercial projects with credits
- Contact me for commercial use

== Change Log ==

1.2 - Feb  2, 2016
 * Fixed bug where interpreter is not cleared out when gameover,
   causing events to continue running even in the gameover scene
1.1 - Dec  1, 2015
 * Fixed bug where party is dead caused gameover loop
1.0 - Nov 29, 2015
 * initial release

== Usage ==

In the plugin parameters, choose the ID of the map that the player
will be sent to upon game over.

You can now event your game over scene.

-------------------------------------------------------------------------
 */ 
var Imported = Imported || {} ;
var TH = TH || {};
Imported.GameOverEvents = 1;
TH.GameOverEvents = TH.GameOverEvents || {};

(function ($) {
 
  $.params = PluginManager.parameters("HIME_GameOverEvents");
  $.MapID = Math.floor($.params["Gameover Map ID"]);
  
  /* Overwrite */
  Scene_Gameover.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    $gameMap._interpreter.clear();
    if (!$gameSwitches.value(4962)) {
    	$gamePlayer.reserveTransfer($.MapID, 0, 0);
    }
  };
  
  /* Overwrite */
  Scene_Gameover.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    if (!$gameSwitches.value(4962)) {
    	SceneManager.goto(Scene_GameoverMap);
    }
  };
  
  function Scene_GameoverMap() {
    this.initialize.apply(this, arguments);
  }
  
  Scene_GameoverMap.prototype = Object.create(Scene_Map.prototype);
  Scene_GameoverMap.prototype.constructor = Scene_GameoverMap;
  
  /* Don't check game over if you're already game over */
  Scene_GameoverMap.prototype.checkGameover = function() {
  };
  
})(TH.GameOverEvents);
