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
var UUID = Java.type("java.util.UUID");

function CEchangeGravity() {
    var ChangeGravityAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_GRAVITY ACTION: Invalid format! Correct format: change_gravity: <entity_uuid|player_name>;<gravity (true|false)>");
                return;
            }

            var identifier = args[0].trim();
            var gravity = args[1].trim().toLowerCase() === "true";

            var target = null;
            try {
                var uuid = UUID.fromString(identifier);
                target = Bukkit.getEntity(uuid);
            } catch (e) {
                target = Bukkit.getPlayer(identifier);
            }

            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_GRAVITY ACTION: Entity not found for: " + identifier);
                return;
            }
			            
            target.setGravity(gravity);
        }
    });

    var changeGravityInstance = new ChangeGravityAction("change_gravity");
    
    return changeGravityInstance;
}

CEchangeGravity();