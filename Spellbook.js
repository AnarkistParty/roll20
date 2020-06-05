var Spellbook = Spellbook || ( function() {

    'use strict';
    //    background: url(https://app.roll20.net/images/dndstyling/spellbg.jpg) center center;
    var scriptName= '📖SpellBook✨';

    var commandListener = function() {

        // Listens for API command

        on( 'chat:message', function( msg ) {

            if( msg.type === 'api' && !msg.rolltemplate ) {


                var params = msg.content.substring( 1 ).split( ' ' ),

                    command = params[0].toLowerCase();

                if( command === 'spellbook' ) {
                    var who=msg.who.replace(' (GM)','');
                    var selected = msg.selected;
                    if(selected==undefined){
                        sendChat(scriptName, '/w '+who.replace(' (GM)','')+' Error, no token selected', null, { noarchive: true });
                        return;
                    }
                    else{
                        selected = selected[0];
                        selected=(findObjs({_id:selected['_id']}))[0];
                    }
                    if(params.length==1){
                        spellbookAll(selected, false, who);
                    }
                    else{
                        log('prepared spells');
                        spellbookAll(selected, true, who);
                    }
                }
                else if(command ==='spellcard'){
                    var who=msg.who.replace(' (GM)','');
                    if(params.length!=2){
                        sendChat(scriptName, '/w '+who+' Error, incorrect number of parameters', null, { noarchive: true });
                    }
                    else
                    {
                        spellcard(params[1], who);
                    }
                }//!spellslot dec 3 -Lp3wb49x6csqBSvfvPt
                else if(command ==='spellslot'){
                    var who=msg.who.replace(' (GM)','');
                    if(params.length!=4){
                        sendChat(scriptName, '/w '+who+' Error, incorrect number of parameters', null, { noarchive: true });
                    }
                    else{
                        changeSpellSlot(params[1], params[2], params[3], who)
                    }
                        
                }

            }

        })

    },
    changeSpellSlot=function(change, niveau, charId, who){
        var mod=change=='dec'?-1:+1;
        var slot = findObjs({name:'lvl'+niveau+'_slots_expended', _characterid:charId});
        if(slot.length==0){
            sendChat(scriptName, '/w '+who+' Error, incorrect parameters', null, { noarchive: true });
        }
        else{
            slot=slot[0];
            var current=parseInt(slot.get('current'));
            if(current>0 || change=='inc'){
                slot.set('current', current+mod);
                sendChat(scriptName, '/w '+who+' Emplacements de niveau '+niveau+' modifiés, restant : '+slot.get('current'), null, { noarchive: true });    
            }
            else{
                sendChat(scriptName, '/w '+who+' Error, cannot have negative slots left in slot level '+niveau, null, { noarchive: true });
            }
            
        }
    },
    spellcard=function(prefix, who){
        var name = findObjs({name:prefix+'_spellname'});
        if(name.length==0){
            sendChat(scriptName, '/w '+who+' Error, spell not found', null, { noarchive: true });
        }
        else{
            name=name[0].get('current');
            var school=getSpellCarac(prefix, 'spellschool');
            var level=getSpellCarac(prefix, 'spelllevel');
            var castingtime=getSpellCarac(prefix, 'spellcastingtime');
            var range=getSpellCarac(prefix, 'spellrange');
            var target=getSpellCarac(prefix, 'spelltarget');
            var v=getSpellToggle(prefix, 'spellcomp_v');
            var s=getSpellToggle(prefix, 'spellcomp_s');
            var m=getSpellToggle(prefix, 'spellcomp_m');
            var material=getSpellCarac(prefix, 'spellcomp_materials');
            var duration=getSpellCarac(prefix, 'spellduration');
            var description=getSpellCarac(prefix, 'spelldescription');
            var athigherlevels=getSpellCarac(prefix, 'spellathigherlevels');
            var ritual=getSpellCarac(prefix, 'spellritual');
            var concentration=getSpellCarac(prefix, 'spellconcentration');
            var charname='';
            sendChat(scriptName, '/w '+who+' '
            +'&{template:spell} {{level='+school+' '+level+'}} {{name='+name+'}} {{castingtime='+castingtime+'}} {{range='+range+'}}' 
            +'{{target='+target+'}} {{v='+v+'}} {{s='+s+'}} {{m='+m+'}} {{material='+material+'}} {{duration='+duration+'}}'
            +'{{description='+description+'}} {{athigherlevels='+athigherlevels+'}} {{ritual='+ritual+'}} {{concentration='+concentration+'}} {{charname='+charname+'}}', null, { noarchive: true });
        }
        
    },
    getSpellCarac=function (prefix, param){
        var carac = findObjs({name:prefix+'_'+param});
        if(carac.length==0){
            return '';
        }
        else {
            return carac[0].get('current');
        }
    },
    getSpellToggle = function (prefix, param){
        var carac = findObjs({name:prefix+'_'+param});
        log('checking '+prefix+_+param);
        if(carac.length==0){
            return '1';
        }
        else {
            carac=carac[0].get('current');
            if(carac==0 || carac.includes('0')){
                return '';
            }
            return carac;
        }
    },
    spellbookAll = function(selected, onlyPrepared, who){
            var charId=selected.get('represents');
            var charName=findObjs({_id:charId})[0];
            charName=charName.get('name');
             
            /*var grimoire='/w "'+charName+'" &{template:default}{{name=@{'+charName
            +'|character_name}: Liste des sorts}}';*/
            var grimoire='/w "'+who+'"'+'<div style="font-family: Times New Roman, Times, serif; margin: .1em;margin-top:.5em; border: 1px solid #999; padding: .1em; border-radius: .1em; background-color: #eee; background: url(https://app.roll20.net/images/dndstyling/spellbg.jpg) center center;">'
                   +'<div style="color: #7e2d40;font-size: 1.2em;width: 6em;float:left">Livre de sorts</div>'
                   +'<div style="text-align: right;overflow: hidden;margin-right: 2em;font-weight: bold;">DC '+getSpellDC(charId)+'</div>'
                   +'<div style="border: none; border-top: 0.25em solid transparent; border-bottom: 0.25em solid transparent; border-left: 14em solid #7e2d40;"></div>'
                   +'<div style="font-size: 0.8em;font-style: italic; margin-bottom: -0.6em;">'+charName+'</div>';
            var spells=[];
            spells[0] = getRepeatingSectionAttrs(charId, 'repeating_spell-cantrip')[0];
            spells[1] = getRepeatingSectionAttrs(charId, 'repeating_spell-1')[0];
            spells[2] = getRepeatingSectionAttrs(charId, 'repeating_spell-2')[0];
            spells[3] = getRepeatingSectionAttrs(charId, 'repeating_spell-3')[0];
            spells[4] = getRepeatingSectionAttrs(charId, 'repeating_spell-4')[0];
            spells[5] = getRepeatingSectionAttrs(charId, 'repeating_spell-5')[0];
            spells[6] = getRepeatingSectionAttrs(charId, 'repeating_spell-6')[0];
            spells[7] = getRepeatingSectionAttrs(charId, 'repeating_spell-7')[0];
            spells[8] = getRepeatingSectionAttrs(charId, 'repeating_spell-8')[0];
            spells[9] = getRepeatingSectionAttrs(charId, 'repeating_spell-9')[0];
            spells.forEach(function(page, niveau){
               if(page.length!=0) {
                  // grimoire+='{{'+getSpellLevel(niveau)+'='+listSpells(page, onlyPrepared, getPrefixFromPageNumber(niveau), charName)+'}}';
                   grimoire+='<div style="margin: .1em;margin-top:0.9em; border: 1px solid #999; padding: .1em; border-radius: .1em;">'
                   +'<div style="font-size: 1em;font-weight: bold;margin-top: -0.7em;background: url(https://app.roll20.net/images/dndstyling/spellbg.jpg) center center;margin-left: 0.5em;padding-left: 0.4em;width: 5em;'+(niveau==0?'':'float: left')+'">'
                   +getSpellLevel(niveau)+' :</div>'
                   +getSpellSlots(niveau, charId)
                   +listSpells(page, onlyPrepared, getPrefixFromPageNumber(niveau), charName)
                   +'</div>';
               }
               
            });
            grimoire+='</div>';
            sendChat(scriptName, grimoire, null, { noarchive: true });
            //log(grimoire);
            
        },
        getSpellDC=function(charId){
            return (findObjs({name:'spell_save_dc',_characterid:charId})[0]).get('current');
        },
        getSpellSlots=function(niveau, charId){
            if(niveau==0){
                return ''
            }
            var current=findObjs({name:'lvl'+niveau+'_slots_expended', _characterid:charId})[0];
            current=current.get('current');
            var max=findObjs({name:'lvl'+niveau+'_slots_total', _characterid:charId})[0];
            max=max.get('current');
            var texte = '<div style="font-size: 1em;font-weight: bold;margin-top: -0.7em;background: url(https://app.roll20.net/images/dndstyling/spellbg.jpg) center center;padding-left: 0px;width: 3.9em;overflow: hidden;">'
                   +current+'/'+max+' '
                   +'<a  style="background-color: transparent;color: #404040;border: none;padding: 0px;" href="!spellslot dec '+niveau+' '+charId+'">'
                   +'<div style="border: 0.1px solid #404040; height: 8px; width: 8px; margin-left: 1px; display: inline-block; line-height: 8px; text-align: center;">-</div></a>/'
                   +'<a  style="background-color: transparent;color: #404040;border: none;padding: 0px;" href="!spellslot inc '+niveau+' '+charId+'">'
                   +'<div style="border: 0.1px solid #404040; height: 8px; width: 8px; margin-left: 1px; display: inline-block; line-height: 8px; text-align: center;">+</div></a>'
                   +'</div>';
            //lvl1_slots_total
            //lvl3_slots_expended
            log(texte);
            return texte;
        },
        escapeHTML=function(s){
            return s.replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace("'", '&#39;')
                .replace('@', '&#64;')
                .replace('{', '&#123;')
                .replace('|', '&#124;')
                .replace('}', '&#125;')
                .replace('[', '&#91;')
                .replace(']', '&#93;')
                .replace('"', '&quot;')
                .replace('%', '&#37;')
                .replace(/(\r\n|\n|\r)/gm,"&#10;");
        },
        getPrefixFromPageNumber = function(level){
            var prefix = 'repeating_spell-';
            if(level == '0'){
                prefix+='cantrip';
            }
            else{
                prefix+=level;
            }
            return prefix+'_';
        },
        listSpells=function(page, onlyPrepared, prefix,charName)
        {
            var text='';
            var isCantrip = prefix.includes('cantrip')
            if(onlyPrepared && !isCantrip){
                page.forEach(function(sort)
                {
                    var prepared=findObjs({name:prefix+sort+'_spellprepared'});
                    
                    if(prepared.length!=0 && (prepared[0]).get('current')!='0'){
                        text+='<div><a style="background-color: transparent;color: black;border: none;padding: 0px;" title="'+escapeHTML(getSpellCarac(prefix+sort,'spelldescription'))+'" href="!spellcard '+prefix+sort+'">📝</a>'
                        +'<a title='+getTooltips(prefix+sort)+' style="background-color: transparent;color: black;border: none;padding: 0px;padding-left:5px;text-decoration: none;" href="'+escapeHTML('~'+charName+'|'+prefix+sort+'_spell')+'">@{'+charName+'|'+prefix+sort+'_spellname}</a></div>';
                    }
                });
            }
            else{
                page.forEach(function(sort){
                   text+='<div><a style="background-color: transparent;color: black;border: none;padding: 0px;" title="'+escapeHTML(getSpellCarac(prefix+sort,'spelldescription'))+'" href="!spellcard '+prefix+sort+'">📝</a>'
                        +'<a title='+getTooltips(prefix+sort)+' style="background-color: transparent;color: black;border: none;padding: 0px;padding-left:5px;text-decoration: none;" href="'+escapeHTML('~'+charName+'|'+prefix+sort+'_spell')+'">@{'+charName+'|'+prefix+sort+'_spellname}</a></div>';
                });
            }
            return text;
        },
        getTooltips=function(prefix){
            return '"Range : '+getSpellCarac(prefix, 'spellrange')+' &#10;Cast : '
            +getSpellCarac(prefix, 'spellcastingtime')+' &#10;Durée : '
            +getSpellCarac(prefix, 'spellduration')
            +'"';
        },
        getSpellLevel = function(level){
            if(level == '0'){
                return 'Cantrips'
            }
            else{
                return 'Niveau '+level;
            }
        },
    getRepeatingSectionAttrs = function (charid, prefix) {
		// Input
		//  charid: character id
		//  prefix: repeating section name, e.g. 'repeating_weapons'
		// Output
		//  repRowIds: array containing all repeating section IDs for the given prefix, ordered in the same way that the rows appear on the sheet
		//  repeatingAttrs: object containing all repeating attributes that exist for this section, indexed by their name
		const repeatingAttrs = {},
			regExp = new RegExp(`^${prefix}_(-[-A-Za-z0-9]+?|\\d+)_`);
		let repOrder;
		// Get attributes
		findObjs({
			_type: 'attribute',
			_characterid: charid
		}).forEach(o => {
			const attrName = o.get('name');
			if (attrName.search(regExp) === 0) repeatingAttrs[attrName] = o;
			else if (attrName === `_reporder_${prefix}`) repOrder = o.get('current').split(',');
		});
		if (!repOrder) repOrder = [];
		// Get list of repeating row ids by prefix from repeatingAttrs
		const unorderedIds = [...new Set(Object.keys(repeatingAttrs)
			.map(n => n.match(regExp))
			.filter(x => !!x)
			.map(a => a[1]))];
		const repRowIds = [...new Set(repOrder.filter(x => unorderedIds.includes(x)).concat(unorderedIds))];
		return [repRowIds, repeatingAttrs];
	};

    return {

        CommandListener: commandListener

    };

}());



on( 'ready', function(){

   'use strict';

   log('------ Spellbook started');

   

   Spellbook.CommandListener();

});
