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
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var Mob = Java.type("org.bukkit.entity.Mob");
var UUID = Java.type("java.util.UUID");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");

function CEchangeTarget() {
    var ChangeTargetAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length != 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TARGET ACTION: Invalid actionLine format! CORRECT FORMAT: change_target: <entity_uuid>;<target_uuid|target_player_name>");
                return;
            }

            var entity = null;
            try {
                entity = Bukkit.getEntity(UUID.fromString(args[0]));
            } catch (e) {}
            
            if (!entity) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TARGET ACTION: Source entity not found: " + args[0]);
                return;
            }
            
            if (!(entity instanceof Mob)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TARGET ACTION: Source entity is not a Mob!");
                return;
            }
            
            var targetEntity = null;
            try {
                targetEntity = Bukkit.getEntity(UUID.fromString(args[1]));
            } catch (e) {
                targetEntity = Bukkit.getPlayer(args[1]);
            }
            
            if (!targetEntity) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TARGET ACTION: Target entity or player not found: " + args[1]);
                return;
            }
            
            if (!(targetEntity instanceof LivingEntity)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_TARGET ACTION: Target entity is not a LivingEntity!");
                return;
            }

            entity.setTarget(targetEntity);
        }
    });

    var changeTargetInstance = new ChangeTargetAction("change_target");

    return changeTargetInstance;
}

CEchangeTarget();