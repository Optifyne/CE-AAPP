/*******************************************************************************  
 *     Copyright (c) 2023 TriggerReactor Team  
 *  
 *     This program is free software: you can redistribute it and/or modify  
 *     it under the terms of the GNU General Public License as published by  
 *     the Free Software Foundation, either version 3 of the License, or  
 *     (at your option) any later version.  
 *  
 *     This program is distributed in the hope that it will be useful,  
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of  
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
 *     GNU General Public License for more details.  
 *  
 *     You should have received a copy of the GNU General Public License  
 *     along with this program. If not, see <http://www.gnu.org/licenses/>.  
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");

function CEchangeSneaking() {
    var ChangeSneakingAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SNEAKING ACTION: Invalid format! Correct format: change_sneaking: <player>;<sneaking (true|false)>");
                return;
            }

            var identifier = args[0].trim();
            var sneaking = args[1].trim().toLowerCase() === "true";

            var target = Bukkit.getPlayer(identifier);

            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_SNEAKING ACTION: Player not found for: " + identifier);
                return;
            }
			            
            target.setSneaking(sneaking);
        }
    });

    var changeSneakingInstance = new ChangeSneakingAction("change_sneaking");
    
    return changeSneakingInstance;
}

CEchangeSneaking();