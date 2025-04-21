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
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var UUID = Java.type("java.util.UUID");

function CEchangeName() {
    var ChangeNameAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_NAME ACTION: Invalid format! Correct format: change_name: <entity_uuid|player_name>;<action (may be SET or RESET)>;<name>;(optional) <visible (true|false)>");
                return;
            }

            var identifier = args[0].trim();
            var action = args[1].trim().toUpperCase();
            var newName = args[2].trim();
            var visible = args[3] ? args[3].trim().toLowerCase() === "true" : null;

            var target = null;
            try {
                var uuid = UUID.fromString(identifier);
                target = Bukkit.getEntity(uuid);
            } catch (e) {
                target = Bukkit.getPlayer(identifier);
            }

            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_NAME ACTION: Entity not found for: " + identifier);
                return;
            }
			
            if (action === "RESET") newName = null;
            
            target.setCustomName(newName);
            if (visible !== null) target.setCustomNameVisible(visible);
        }
    });

    var changeNameInstance = new ChangeNameAction("change_name");
    
    return changeNameInstance;
}

CEchangeName();