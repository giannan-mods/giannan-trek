//=============================================================================
// Astfgl Programmable Actor AI
// by Astfgl
// Date: 12/05/2017
// Latest revision 27/05/2018
// 20/05/2017 -> Added the possibility to delete a line
// 21/03/2018 -> Fixed missing alias
// 27/05/2018 -> added parameters and notetags
// TOU:
// Yanfly's terms of use apply, please credit me with any of the following
// Astfgl66/Pierre MATEO/Pierre MATEO (Astfgl66).
//=============================================================================


/*:
 * @plugindesc Actor with the autobattle flag will use a custom AI
 * @author Astfgl
 * @help Requires Yanfly's Battle AI core plugin.
 * This plugin can do two things:
 * If the parameter is set to false, actor with an autobattle flag
 * set via a trait (actor, class, equipment or state) will use
 * yanfly's AI notetag to determine action patterns.
 * Use the actor's note box just as you would an enemy's.
 *
 * If the parameter is set to true, it will allow the player to
 * determine the AI of his party members via a custom scene.
 * To call the scene use: SceneManager.push(Scene_AI)
 *
 * Made with Battle AI core v1.12
 *
 * How to add to yanfly's main menu manager:
 * Name: "AI"
 * Symbol: ai
 * Show: true
 * Enabled: true
 * Main bind: this.commandPersonal.bind(this)
 * Actor bind: SceneManager.push(Scene_AI)
 *
 * V2-> added parameter and notetags to remove skills states and elements from
 * windows.
 * Parameters are global and unmodifiable.
 * Notetags are on a per actor basis and dynamic.
 * <AIRS: [1,2]> in harolds note box will prevent skills 1 and 2 to show, even if learned, for Harolds AI.
 * <AIRE: [1,2]> same but for elements 1 and 2.
 * <AIRSt: [1,2]> same but for states 1 and 2.
 * These notetags are evaled each time the AI Line window is created.
 * This means you can use a game variable to store the array, and modify it in game via events.
 *
 * @param InGameAI
 * @desc If enabled, the player will be able to define AI in game.
 * If not use notetags just as for an enemy to define patterns.
 * @default true
 *
 * @param ElemRemove
 * @desc Elements in this array will not appear in the
 * in game list. Ex: [0,1,2,3,...]
 * @default []
 *
 * @param SkillRemove
 * @desc Skills in this array will not appear in the
 * in game list. Ex: [0,1,2,3,...]
 * @default []
 *
 * @param StateRemove
 * @desc States in this array will not appear in the
 * in game list. Ex: [0,1,2,3,...]
 * @default []
 */

var Astfgl = Astfgl || {}
Astfgl.parameters = Astfgl.parameters || {}
Astfgl.parameters.actorAI = {}
Astfgl.parameters.actorAI.inGameAI = PluginManager.parameters("AstfglActorAI").InGameAI
Astfgl.parameters.actorAI.ElemRemove = eval(PluginManager.parameters("AstfglActorAI").ElemRemove)
Astfgl.parameters.actorAI.SkillRemove = eval(PluginManager.parameters("AstfglActorAI").SkillRemove)
Astfgl.parameters.actorAI.StateRemove = eval(PluginManager.parameters("AstfglActorAI").StateRemove)

//=============================================================================
// Game_Party
//=============================================================================
 
Game_Party.prototype.updateAIPatterns = function() {
    for (var i = 0; i < this.aliveMembers().length; ++i) {
      var member = this.aliveMembers()[i];
      if (member) member.setAIPattern();
    }
};

Game_Party.prototype.setup = function(troopId) {
    this._aiKnownElementRates = this._aiKnownElementRates || {};
};
 
Game_Party.prototype.aiElementRateKnown = function(target, elementId) {
    if (target.isActor()) return true;
    if (!Yanfly.Param.CoreAIElementTest) return true;
    var index = target.index();
    if (this._aiKnownElementRates[index] === undefined) {
      this._aiKnownElementRates[index] = [];
    }
    return this._aiKnownElementRates[index].contains(elementId);
};
 
Game_Party.prototype.aiRegisterElementRate = function(target, elementId) {
    if (!Yanfly.Param.CoreAIElementTest) return;
    var index = target.index();
    if (this._aiKnownElementRates[index] === undefined) {
      this._aiKnownElementRates[index] = [];
    }
    if (!this._aiKnownElementRates[index].contains(elementId)) {
      this._aiKnownElementRates[index].push(elementId);
    }
};

//=============================================================================
// Game_Actor
//=============================================================================


Yanfly.CoreAI.Game_Actor_makeActions = Game_Actor.prototype.makeActions;
Game_Actor.prototype.makeActions = function() {
    if (this.isAutoBattle() && this.actor().aiPattern.length > 0) {
      this.setAIPattern();
      this.setActionState('waiting');
    } else {
      Yanfly.CoreAI.Game_Actor_makeActions.call(this);
    }
};
 
Game_Actor.prototype.aiConsiderTaunt = function() {
  if (!Imported.YEP_Taunt) return false;
  return this.actor().aiConsiderTaunt;
};
 
Game_Actor.prototype.setAIPattern = function() {
    Game_Battler.prototype.setAIPattern.call(this);
    if (this.numActions() <= 0) return;
    AIManager.setBattler(this);
	if (!Astfgl.parameters.actorAI.inGameAI) {
		for (var i = 0; i < this.actor().aiPattern.length; ++i) {
		  if (Math.random() > this.aiLevel()) continue;
		  var line = this.actor().aiPattern[i];
		  if (AIManager.isDecidedActionAI(line)) return;
		}
	} else {
		for (var i = 0; i < this._AILines.length; i++) {
			if (Math.random() > this.aiLevel()) continue;
			var line = this._AILines[i].makeOutput();
			if (AIManager.isDecidedActionAI(line)) return;
		}
	}
    Yanfly.CoreAI.Game_Actor_makeActions.call(this);
};
 
Game_Actor.prototype.aiLevel = function() {
    return this.actor().aiLevel;
};

if (Yanfly.Param.CoreAIDynamic) {
  BattleManager.getNextSubject = function() {
    var battler = Yanfly.CoreAI.BattleManager_getNextSubject.call(this);
	if (battler && battler.isEnemy()) battler.setAIPattern();
    if (battler && battler.isActor() && battler.isAutoBattle()) battler.setAIPattern();
    return battler;
  };
};

//========================================================
//LoadNotetags
//========================================================
Yanfly.CoreAI.DataManager_isDatabaseLoaded2 = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
  if (!Yanfly.CoreAI.DataManager_isDatabaseLoaded2.call(this)) return false;
  if (!Yanfly._loaded_YEP_BattleAICore2) {
    this.processCoreAINotetags1($dataActors);
    Yanfly._loaded_YEP_BattleAICore2 = true;
  }
    return true;
};

//Initialize actor enemy weakness knowledge
(function(){
	var _Astfgl_newSBS = Scene_Battle.prototype.initialize
	Scene_Battle.prototype.initialize = function() {
		_Astfgl_newSBS.call(this);
		$gameParty.setup();
	}
	var _Astfgl_GAS = Game_Actor.prototype.setup
	Game_Actor.prototype.setup = function(actorId) {
		_Astfgl_GAS.call(this,actorId)
		this._AILines = [0]
	}
	
})()


function AILine() {
    this.initialize.apply(this, arguments);
}

AILine.prototype = {}
AILine.prototype.constructor = AILine;

AILine.prototype.initialize = function(actor) {
	this._actor = actor;
	this._condition = 0;
	this._skill = 0;
	this._param = -1;
	this._numCond = -1;
	this._num = 0;
	this._elem = -1;
	this._elemCond = -1;
	this._state = 0;
	this._lvlCond = -1;
	this._output = "";
	this._targetting = -1;
	this._checks = [];
	this._needsParam = false;
	this._hasParam = false;
	this._needsElement = false;
	this._hasElement = false;
	this._needsNum = false;
	this._hasNum = false;
	this._needsNumCond = false;
	this._hasNumCond = false;
	this._needsState = false;
	this._hasState = false;
	this._needsElemCond = false;
	this._hasElemCond = false;
	this._hasSkill = false;
	this._needsLvlCond = false;
	this._hasLvlCond = false;
	this._hasTargetting = false;
	this.setupConditions();
	this.setupParams();
	this.setupNumConds();
	this.setupElemConds();
	this.setupLvlConds();
	this.setupTargetting();
};

AILine.prototype.setupConditions = function() {
	this.conditions = []
	this.conditions.push("Always")
	this.conditions.push("Element")
	this.conditions.push("Party Alive Members")
	this.conditions.push("Troop Alive Members")
	this.conditions.push("Party Dead Members")
	this.conditions.push("Troop Dead Members")
	this.conditions.push("param")
	this.conditions.push("Party Level")
	this.conditions.push("Random")
	this.conditions.push("State ===")
	this.conditions.push("State !==")
	this.conditions.push("Turn")
	this.conditions.push("User param")
	this.conditions.push("Delete")
}

AILine.prototype.setupParams = function() {
	this.params = [];
	this.params.push("atk")
	this.params.push("def")
	this.params.push("mat")
	this.params.push("mdf")
	this.params.push("agi")
	this.params.push("luk")
	this.params.push("maxhp")
	this.params.push("maxmp")
	this.params.push("hp")
	this.params.push("mp")
	this.params.push("hp%")
	this.params.push("mp%")
	this.params.push("level")
	this.params.push("tp")
	this.params.push("maxtp")
	this.params.push("tp%")
}

AILine.prototype.setupNumConds = function() {
	this.numConds = []
	this.numConds.push(">")
	this.numConds.push("<")
	this.numConds.push("===")
	this.numConds.push(">=")
	this.numConds.push("<=")
	this.numConds.push("!==")
}

AILine.prototype.setupElemConds = function() {
	this.elemConds = []
	this.elemConds.push("Neutral")
	this.elemConds.push("Weakness")
	this.elemConds.push("Resistant")
	this.elemConds.push("Null")
	this.elemConds.push("Absorb")
}

AILine.prototype.setupLvlConds = function() {
	this.lvlConds = []
	this.lvlConds.push("Highest");
	this.lvlConds.push("Lowest");
	this.lvlConds.push("Average");
}

AILine.prototype.setupTargetting = function() {
	this.targetting = []
	this.targetting.push("None");
	this.targetting.push("First");
	this.targetting.push("User");
	this.targetting.push("Highest MaxHP")
	this.targetting.push("Highest HP")
	this.targetting.push("Highest HP%")
	this.targetting.push("Highest MP")
	this.targetting.push("Highest MP%")
	this.targetting.push("Highest MaxMP")
	this.targetting.push("Highest MaxTP")
	this.targetting.push("Highest TP")
	this.targetting.push("Highest TP%")
	this.targetting.push("Highest ATK")
	this.targetting.push("Highest DEF")
	this.targetting.push("Highest MAT")
	this.targetting.push("Highest MDF")
	this.targetting.push("Highest LUK")
	this.targetting.push("Highest Level")
	this.targetting.push("Lowest MaxHP")
	this.targetting.push("Lowest HP")
	this.targetting.push("Lowest HP%")
	this.targetting.push("Lowest MP")
	this.targetting.push("Lowest MP%")
	this.targetting.push("Lowest MaxMP")
	this.targetting.push("Lowest MaxTP")
	this.targetting.push("Lowest TP")
	this.targetting.push("Lowest TP%")
	this.targetting.push("Lowest ATK")
	this.targetting.push("Lowest DEF")
	this.targetting.push("Lowest MAT")
	this.targetting.push("Lowest MDF")
	this.targetting.push("Lowest LUK")
	this.targetting.push("Lowest Level")
}

AILine.prototype.setCondition = function(id) {
	if (id < 0) {return};
	if (id >= this.conditions.length) {return}
	this._condition = id
}

AILine.prototype.setSkill = function(skill) {
	this._skill = skill;
	this._hasSkill = true;
}

AILine.prototype.setParam = function(id) {
	if (id < 0) {return};
	if (id >= this.params.length) {return}
	this._param = id;
	this._hasParam = true;
}

AILine.prototype.setElement = function(id) {
	if (id < 0) {return};
	if (id >= $dataSystem.elements.length) {return}
	var d = $dataSystem.elements.slice(0)
	d.splice(0,1)
	d.forEach(function(e, i) {if (Astfgl.parameters.actorAI.ElemRemove.includes($dataSystem.elements.indexOf(e))) {d.splice(i,1)}})
	var actorData = $dataActors[this._actor.actorId()]
	if (actorData.meta.AIRE) {
		let list = eval(actorData.meta.AIRE);
		d.forEach(function(e, i) {if (list.includes($dataSystem.elements.indexOf(e))) {d.splice(i,1)}})
	}
	this._elem = $dataSystem.elements.indexOf(d[id]);
	this._hasElement = true;
}

AILine.prototype.setNumCond = function(id) {
	if (id < 0) {return};
	if (id >= this.numConds.length) {return}
	this._numCond = id;
	this._hasNumCond = true;
}

AILine.prototype.setNum = function(num) {
	this._num = num;
	this._hasNum = true;
}

AILine.prototype.setState = function(state) {
	this._state = state;
	this._hasState = true;
}

AILine.prototype.setLvlCond = function(id) {
	if (id < 0) {return};
	if (id >= this.lvlConds.length) {return}
	this._lvlCond = id;
	this._hasLvlCond = true;
}

AILine.prototype.setElemCond = function(id) {
	if (id < 0) {return};
	if (id >= this.elemConds.length) {return}
	this._elemCond = id;
	this._hasElemCond = true;
}

AILine.prototype.setTargetting = function(id) {
	if (id < -1) {return};
	if (id >= this.targetting.length) {return}
	this._targetting = id;
	this._hasTargetting = true;
	if (id < 1) {
		this._hasTargetting = false;
	}
}

AILine.prototype.makeOutput = function()  {
	var first, second, third, fourth
	this._checks = []
	if (this._condition === 0) {
		this._checks.push("skill")
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		this._output = "Always: Skill " + this._skill.id
	}
	if (this._condition === 1) {
		this._checks.push("elem");
		this._checks.push("elem cond");
		this._checks.push("skill");
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		this._output = "Element " + (this._elem ) + " " + ": Skill " + this._skill.id
	}
	if (this._condition === 2 || this._condition === 3 || this._condition === 4 || this._condition === 5 || this._condition === 11) {
		this._checks.push("num cond");
		this._checks.push("num");
		this._checks.push("skill");
		if (this._condition === 2) {first = "Party Alive Members"}
		if (this._condition === 3) {first = "Troop Alive Members"}
		if (this._condition === 4) {first = "Party Dead Members"}
		if (this._condition === 5) {first = "Troop Dead Members"}
		if (this._condition === 11) {first = "Turn"}
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		this._output = first + " " + this.numConds[this._numCond] + " " + this._num + ": Skill " + this._skill.id
	}
	if (this._condition === 6 || this._condition === 12) {
		this._checks.push("param");
		this._checks.push("num cond");
		this._checks.push("num");
		this._checks.push("skill");
		if (this._condition === 6) {first = ""}
		if (this._condition === 12) {first = "User "}
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		var numText = ""
		if (this._param === 10 || this._param === 11 || this._param === 15) {
			numText = "%"
		}
		
		this._output = first + this.params[this._param] + " param " + this.numConds[this._numCond] + " " + this._num + numText + ": Skill " + this._skill.id
	}
	if (this._condition === 7) {
		this._checks.push("lvl cond");
		this._checks.push("num cond");
		this._checks.push("num");
		this._checks.push("skill");
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		this._output = this.lvlConds[this._lvlCond] + " Party Level " + this.numConds[this._numCond] + " " + this._num + ": Skill " + this._skill.id
	}
	if (this._condition === 8) {
		this._checks.push("num");
		this._checks.push("skill");
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		this._output = "Random " + this._num + "%: Skill " + this._skill.id
	}
	if (this._condition === 9 || this._condition === 10) {
		this._checks.push("state");
		this._checks.push("skill");
		
		if (!this.valid()) {
			console.log("invalid AI condition")
			return
		}
		
		if (this._condition === 9) {first = "State === "}
		if (this._condition === 10) {first = "State !== "}
		this._output = first + this._state.id + ": Skill " + this._skill.id
	}
	if (this._hasTargetting) {
		this._output += ", " + this.targetting[this._targetting]
	}
	return this._output
}

AILine.prototype.valid = function() {
	for (var i = 0; i < this._checks.length; i++) {
		var check = this._checks[i]
		if (check === "num") {
			if (!this._hasNum) {return false}
		}
		if (check === "num cond") {
			if (!this._hasNumCond) {return false}
		}
		if (check === "elem") {
			if (!this._hasElement) {return false}
		}
		if (check === "elem cond") {
			if (!this._hasElemCond) {return false}
		}
		if (check === "skill") {
			if (!this._hasSkill) {return false}
		}
		if (check === "param") {
			if (!this._hasParam) {return false}
		}
		if (check === "lvl cond") {
			if (!this._hasLvlCond) {return false}
		}
		if (check === "state") {
			if (!this._hasState) {return false}
		}
	}
	return true
}

//============================================================
// Window_SetAI
//============================================================

function Window_SetAI() {
    this.initialize.apply(this, arguments);
}

Window_SetAI.prototype = Object.create(Window_Selectable.prototype);
Window_SetAI.prototype.constructor = Window_SetAI;

Window_SetAI.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._actor = SceneManager._scene._actor
    this._data = [];
	this._line = new AILine(this._actor)
	this._type = -1;
	this._previousType = -1;
	this._step = 0;
	this._checks = [-1,9]
	this.refresh();
};

Window_SetAI.prototype.maxCols = function() {
    if (this._type === -1) {
		return 1
	} else {
		return 2
	}
};

Window_SetAI.prototype.spacing = function() {
    return 48;
};

Window_SetAI.prototype.maxItems = function() {
    return this._data ? this._data.length : 1;
};

Window_SetAI.prototype.item = function() {
    return this._data && this.index() >= 0 ? this._data[this.index()] : null;
};

Window_SetAI.prototype.isCurrentItemEnabled = function() {
    return true;
};

Window_SetAI.prototype.makeItemList = function() {
	var actorData = $dataActors[this._actor.actorId()]
    if (this._line) {
		if (this._type === -1) {
			//AILine
			this._data = this._actor._AILines
		}
		if (this._type === 0) {
			//skills
			var skills = []
			skills.push($dataSkills[this._line._actor.attackSkillId()])
			skills.push($dataSkills[this._line._actor.guardSkillId()])
			var skillList = skills.concat(this._line._actor.skills())
			skillList.forEach(function(skill, i) {if (Astfgl.parameters.actorAI.SkillRemove.includes(skill.id)) {skillList.splice(i,1)}})
			if (actorData.meta.AIRS) {
				let list = eval(actorData.meta.AIRS);
				skillList.forEach(function(skill, i) {if (list.includes(skill.id)) {skillList.splice(i,1)}})
			}
			this._data = skillList; //$dataSkills[index].name
		}
		if (this._type === 1) {
			//numbers
			this._data = [0,1,2,3,4,5,6,7,8,9,10];
		}
		if (this._type === 2) {
			//number conditions
			this._data = this._line.numConds;
		}
		if (this._type === 3) {
			//elements
			var d = $dataSystem.elements.slice(0);
			d.splice(0,1);
			d.forEach(function(e, i) {if (Astfgl.parameters.actorAI.ElemRemove.includes($dataSystem.elements.indexOf(e))) {d.splice(i,1)}})
			if (actorData.meta.AIRE) {
				let list = eval(actorData.meta.AIRE);
				d.forEach(function(e, i) {if (list.includes($dataSystem.elements.indexOf(e))) {d.splice(i,1)}})
			}
			this._data = d; //remember to add 1 when gathering index
		}
		if (this._type === 4) {
			//element conditions
			this._data = this._line.elemConds;
		}
		if (this._type === 5) {
			//parameters
			this._data = this._line.params;
		}
		if (this._type === 6) {
			//level conditions
			this._data = this._line.lvlConds;
		}
		if (this._type === 7) {
			//states
			var d = $dataStates.slice(0)
			d.splice(0,1)
			d.forEach(function(s, i) {if (Astfgl.parameters.actorAI.StateRemove.includes(s.id)) {d.splice(i,1)}})
			if (actorData.meta.AIRSt) {
				let list = eval(actorData.meta.AIRSt);
				d.forEach(function(s, i) {if (list.includes(s.id)) {d.splice(i,1)}})
			}
			this._data =  d; //$dataStates[index].name
		}
		if (this._type === 8) {
			//targetting
			this._data = this._line.targetting
		}
		if (this._type === 9) {
			//conditions
			this._data = this._line.conditions
		}
    } else {
        this._data = [];
    }
};

Window_SetAI.prototype.setLine = function(actor) {
	this._line = new AILine(actor);
}

Window_SetAI.prototype.setType = function(type) {
	this._previousType = this._type
	if (type === 1) {
		this.deactivate();
		this.hide();
		$gameMessage.setNumberInput(1, 5);
	}
	this._type = type;
	this.refresh();
	this.select(0)
}

Window_SetAI.prototype.selectLast = function() {
	 this.select(0)
}

Window_SetAI.prototype.drawItem = function(index) {
	var item = this._data[index];
	var rect = this.itemRect(index);
    rect.width -= this.textPadding();
	if (this._type === 0 || this._type === 7) {
		this.drawText(item.name,rect.x, rect.y, rect.width);
	} else if(this._type === -1) {
		if (item instanceof AILine) {
			var txt = this.makeLineDescription(this._data[index])
			this.drawText(txt,rect.x, rect.y, rect.width);
		} else {
			this.drawText("Create new line",rect.x, rect.y, rect.width);
		}
	} else {
		this.drawText(item,rect.x, rect.y, rect.width);
	}
}

Window_SetAI.prototype.updateHelp = function() {
	this._helpWindow.clear()
	this._helpWindow.secondLine = ""
	if (this._step >= 2) {
		for (var i = 1; i < this._step; i++) {
			var txt = ""
			if (this._checks[i] === 0) {
				txt = this._line._skill.name
			}
			if (this._checks[i] === 1) {
				txt = this._line._num
			}
			if (this._checks[i] === 2) {
				txt = this._line.numConds[this._line._numCond]
			}
			if (this._checks[i] === 3) {
				txt = $dataSystem.elements[this._line._elem]
			}
			if (this._checks[i] === 4) {
				txt = this._line.elemConds[this._line._elemCond]
			}
			if (this._checks[i] === 5) {
				txt = this._line.params[this._line._param]
			}
			if (this._checks[i] === 6) {
				txt = this._line.lvlConds[this._line._lvlCond]
			}
			if (this._checks[i] === 7) {
				txt = this._line._state.name
			}
			if (this._checks[i] === 8) {
				if (this._line._targetting > 1) {
					txt = this._line.targetting[this._line._targetting]
				}
			}
			if (this._checks[i] === 9) {
				txt = this._line.conditions[this._line._condition]
			}
			this._helpWindow.secondLine += txt + " "
		}
	}
    if (this._type === -1) {
		this._helpWindow.setText("Choose a line.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 9) {
		this._helpWindow.setText("Choose a condition.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 0) {
		this._helpWindow.setText("Choose a skill.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 1) {
		this._helpWindow.setText("Choose a number.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 2) {
		this._helpWindow.setText("Choose a comparison operator.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 3) {
		this._helpWindow.setText("Choose an element.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 4) {
		this._helpWindow.setText("Choose an element condition.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 5) {
		this._helpWindow.setText("Choose a parameter.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 6) {
		this._helpWindow.setText("Choose a level condition.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 7) {
		this._helpWindow.setText("Choose a state.\n" + this._helpWindow.secondLine)
	}
	if (this._type === 8) {
		this._helpWindow.setText("Choose a targetting condition.\n" + this._helpWindow.secondLine)
	}
	this._helpWindow.refresh();
};

Window_SetAI.prototype.refresh = function() {
    this.makeItemList();
    this.createContents();
    this.drawAllItems();
};
//var temp = new Window_SetAI(0,0,800,600); SceneManager._scene.addWindow(temp); temp.activate();

Window_SetAI.prototype.makeLineDescription = function(line) {
	var skill = line._skill.name;
	if (line._condition === 0) {
		txt = skill
	} else if (line._condition === 1) {
		txt = skill + ": target is " + line.elemConds[line._elemCond] + " to " + $dataSystem.elements[line._elem]
	} else if (line._condition === 2) {
		txt = skill + ": alive party members " + line.numConds[line._numCond] + line._num
	} else if (line._condition === 3) {
		txt = skill + ": alive troop members " + line.numConds[line._numCond] + line._num
	} else if (line._condition === 4) {
		txt = skill + ": dead party members " + line.numConds[line._numCond] + line._num
	} else if (line._condition === 5) {
		txt = skill + ": dead troop members " + line.numConds[line._numCond] + line._num
	} else if (line._condition === 6) {
		txt = skill + ": target " + line.params[line._param] + " is " + line.numConds[line._numCond] + " to " + line._num
	} else if (line._condition === 7) {
		txt = skill + ": target level is " + line.lvlConds[line._lvlCond] + " to " + line._num
	} else if (line._condition === 8) {
		txt = skill + ": " + line._num + "% chance"
	} else if (line._condition === 9) {
		txt = skill + ": target is afflicted by state " + line._state.name
	} else if (line._condition === 10) {
		txt = skill + ": target is not afflicted by state " + line._state.name
	} else if (line._condition === 11) {
		txt = skill + ": turn is " + line.numConds[line._numCond] + line._num
	} else if (line._condition === 12) {
		txt = skill + ": caster " + line.params[line._param] + " is " + line.numConds[line._numCond] + " to " + line._num
	}
	if (line._hasTargetting) {
		txt += ", " + line.targetting[line._targetting] + "."
	} else {
		txt += ", random."
	}
	return txt
}

//Window_AIDesc
function Window_AIDesc() {
    this.initialize.apply(this, arguments);
}

Window_AIDesc.prototype = Object.create(Window_Base.prototype);
Window_AIDesc.prototype.constructor = Window_AIDesc;

Window_AIDesc.prototype.initialize = function(numLines) {
    var width = Graphics.boxWidth - 200;
    var height = this.fittingHeight(numLines || 2);
    Window_Base.prototype.initialize.call(this, 200, 0, width, height);
    this._text = '';
};

Window_AIDesc.prototype.setText = function(text) {
    if (this._text !== text) {
        this._text = text;
        this.refresh();
    }
};

Window_AIDesc.prototype.clear = function() {
    this.setText('');
};

Window_AIDesc.prototype.refresh = function() {
    this.contents.clear();
    this.drawTextEx(this._text, this.textPadding(), 0);
};

//Window_AIName
function Window_AIName() {
    this.initialize.apply(this, arguments);
}

Window_AIName.prototype = Object.create(Window_Base.prototype);
Window_AIName.prototype.constructor = Window_AIName;

Window_AIName.prototype.initialize = function(numLines) {
    var width = 200;
    var height = this.fittingHeight(numLines || 2);
    Window_Base.prototype.initialize.call(this, 0, 0, width, height);
    this._text = '';
};

Window_AIName.prototype.setText = function(text) {
    if (this._text !== text) {
        this._text = text;
        this.refresh();
    }
};

Window_AIName.prototype.clear = function() {
    this.setText('');
};

Window_AIName.prototype.refresh = function() {
    this.contents.clear();
    this.drawTextEx(this._text, this.textPadding(), 0);
};

//Scene AI
function Scene_AI() {
    this.initialize.apply(this, arguments);
}

Scene_AI.prototype = Object.create(Scene_MenuBase.prototype);
Scene_AI.prototype.constructor = Scene_AI;

Scene_AI.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_AI.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
	this.createNameWindow();
	this.createDescWindow();
	this.createAIWindow();
	this.createMessageWindow();
	this._messageWindow.hide();
	this._AIWindow.activate();
	this._AIWindow.select(0)
};

Scene_AI.prototype.createNameWindow = function() {
	var win = new Window_AIName(2)
	this._nameWindow = win;
	this.addWindow(this._nameWindow)
	if (this._actor) {
		this._nameWindow.setText(this._actor.name())
	}
}

Scene_AI.prototype.createDescWindow = function() {
	var win = new Window_AIDesc(2);
	this._descWindow = win;
	this.addWindow(this._descWindow)
}

Scene_AI.prototype.createAIWindow = function() {
	var win = new Window_SetAI(0,this._descWindow.height,Graphics.boxWidth,Graphics.boxHeight - this._descWindow.height);
	this._AIWindow = win;
	this._AIWindow.setHandler('ok',     this.onAIOk.bind(this));
    this._AIWindow.setHandler('cancel', this.onAICancel.bind(this));
	this._AIWindow.setHandler('pagedown', this.nextActor.bind(this));
    this._AIWindow.setHandler('pageup',   this.previousActor.bind(this));
	this.addWindow(this._AIWindow);
	this._AIWindow._helpWindow = this._descWindow;
}

Scene_AI.prototype.onAIOk = function() {
	if (this._messageWindow._numberWindow.active) {this._messageWindow._numberWindow.processOk(); return}
	var win = this._AIWindow
	if (win._type === -1) {
		if (win._data[win.index()] === 0) {
			win._line = new AILine(win._actor)
			win._actor._AILines[win.index()] = win._line
			win.setType(9)
			win._actor._AILines.push(0)
		} else {
			win._line = win._actor._AILines[win.index()]
			win.setType(9)
		}
		win._lineIndex = win.index()
		win._step = 1;
		win.activate();
		win.select(win._line._condition)
		return
	}
	if (win._type === 0) {
		win._line.setSkill(win._data[win.index()])
		win.setType(8);
		win.activate();
		win.select(0);
		win._step +=1;
		return
	}
	if (win._type === 9) {
		win._line.setCondition(win.index())
		if (win._line._condition === 0) {
			win._checks = [-1,9,0,8]
			win._step = 2;
			win.setType(0)
			win.select(0)
		}
		if (win._line._condition === 1) {
			win._checks = [-1,9,3,4,0,8]
			win._step = 2;
			win.setType(3)
			win.select(win._line._elem)
		}
		if (win._line._condition === 2 || win._line._condition === 3 || win._line._condition ===4 || win._line._condition === 5 || win._line._condition === 11) {
			win._checks = [-1,9,2,1,0,8]
			win._step = 2;
			win.setType(2)
			win.select(win._line._numCond)
		}
		if (win._line._condition === 6 || win._line._condition === 12) {
			win._checks = [-1,9,5,2,1,0,8]
			win._step = 2;
			win.setType(5)
			win.select(win._line._param)
		}
		if (win._line._condition === 7) {
			win._checks = [-1,9,6,2,1,0,8]
			win._step = 2;
			win.setType(6)
			win.select(win._line._lvlCond)
		}
		if (win._line._condition === 8) {
			win._checks = [-1,9,1,0,8]
			win._step = 2;
			win.setType(1)
			win.select(win._line._num)
		}
		if (win._line._condition === 9 || win._line._condition === 10) {
			win._checks = [-1,9,7,0,8]
			win._step = 2;
			win.setType(7)
			win.select(0)
		}
		if (win._line._condition === 13) {
			win.setType(-1);
			win._actor._AILines.splice(win._lineIndex,1);
			if (win._actor._AILines.length === 0) {
				win._actor._AILines.push(0)
			}
			win._line = new AILine(win._actor)
			win.refresh();
			win.select(0);
		}
		win.activate();
		return
	}
	if (win._type === 3) {
		win._line.setElement(win.index());
		win.setType(4);
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 4) {
		win._line.setElemCond(win.index());
		win.setType(0);
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 2) {
		win._line.setNumCond(win.index())
		win.setType(1);
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 1) {
		win._line.setNum($gameVariables.value(1));
		win.setType(0);
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 5) {
		win._line.setParam(win.index());
		win.setType(2)
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 6) {
		win._line.setLvlCond(win.index());
		win.setType(2)
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 7) {
		win._line.setState(win._data[win.index()]);
		win.setType(0);
		win.activate();
		win._step += 1;
		return
	}
	if (win._type === 8) {
		win._line.setTargetting(win.index());
		win.setType(-1);
		win.activate();
		win._step += 1;
		return
	}
}

Scene_AI.prototype.onAICancel = function() {
	var win = this._AIWindow;
	if (win._type === 1) {
		return
	}
	if (win._type === -1) {
		this.popScene();
	} else {
		win._step -= 1;
		win.setType(win._checks[win._step])
		win.activate();
	}
}

Scene_AI.prototype.createMessageWindow = function() {
    this._messageWindow = new Window_Message();
    this.addWindow(this._messageWindow);
    this._messageWindow.subWindows().forEach(function(window) {
        this.addWindow(window);
    }, this);
	this._messageWindow._numberWindow.processOk = this.onNumOk
};

Scene_AI.prototype.onNumOk = function() { //this is actually called in the message window number window context and not in the scene AI context
	SoundManager.playOk();
	SceneManager._scene._AIWindow._line.setNum(this._number)
	this._messageWindow.terminateMessage();
    this.updateInputData();
    this.deactivate();
    this.close();
	SceneManager._scene._AIWindow._step += 1;
	SceneManager._scene._AIWindow.setType(0);
	SceneManager._scene._AIWindow.show();
	SceneManager._scene._AIWindow.activate();
}

Scene_MenuBase.prototype.onActorChange = function() {
	this.updateActor();
	this._AIWindow._actor = this._actor;
	this._AIWindow._data = [];
	this._AIWindow._line = new AILine(this._actor)
	this._AIWindow._type = -1;
	this._AIWindow._previousType = -1;
	this._AIWindow._step = 0;
	this._AIWindow._checks = [-1,9]
	this._AIWindow.refresh();
	this._AIWindow.select(0);
	this._AIWindow.activate();
	this._nameWindow.setText(this._actor.name())
};