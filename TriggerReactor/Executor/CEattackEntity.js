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
var Entity = Java.type("org.bukkit.entity.Entity");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");

function CEattackEntity() {
    var AttackEntityAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";", 2);
            if (args.length !== 2) {
                Bukkit.getLogger().warning("[CEActions] ATTACK_ENTITY ACTION: Invalid format! Correct format: attack_entity: <attacker_entity_uuid|attacker_player_name>;<target_uuid>");
                return;
            }

            var attackerId = args[0].trim();
            var targetUUID = args[1].trim();
            
            var attacker = null;
            try {
                attacker = Bukkit.getEntity(UUID.fromString(attackerId));
            } catch (e) {
                attacker = Bukkit.getPlayer(attackerId);
            }
            
            if (!attacker) {
                Bukkit.getLogger().warning("[CEActions] ATTACK_ENTITY ACTION: Invalid attacker.");
                return;
            }

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(targetUUID));
            } catch (e) {
                Bukkit.getLogger().warning("[CEActions] ATTACK_ENTITY ACTION: Invalid target.");
                return;
            }

            if (!(attacker instanceof LivingEntity)) {
                Bukkit.getLogger().warning("[CEActions] ATTACK_ENTITY ACTION: Attacker is not a LivingEntity.");
                return;
            }

            attacker.attack(target);
        }
    });

    var attackEntityInstance = new AttackEntityAction("attack_entity");
    
    return attackEntityInstance;
}

CEattackEntity();