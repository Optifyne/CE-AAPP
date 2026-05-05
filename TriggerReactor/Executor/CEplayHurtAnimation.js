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
var UUID = Java.type("java.util.UUID");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");

function CEplayHurtAnimation() {
    var PlayHurtAnimationAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] PLAY_HURT_ANIMATION ACTION: Invalid format! Use: play_hurt_animation: <entity_uuid|player_name>;<yaw>");
                return;
            }
            
            var targetIdentifier = args[0].trim();
            var yaw = parseFloat(args[1]);
            
            if (isNaN(yaw)) {
                Bukkit.getLogger().warning("[CEActions] PLAY_HURT_ANIMATION ACTION: Yaw should be a number!");
                return;
            }

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
            	target = Bukkit.getPlayer(targetIdentifier);
            }
            
            if (!target) {
                Bukkit.getLogger().warning("[CEActions] PLAY_HURT_ANIMATION ACTION: Entity or player not found: " + args[0]);
                return;
            }
            
            if (target instanceof LivingEntity) {
                target.playHurtAnimation(yaw);
            } else {
                Bukkit.getLogger().warning("[CEActions] PLAY_HURT_ANIMATION ACTION: Target is not a LivingEntity!");
                return;
            }
        }
    });

    var playHurtAnimationInstance = new PlayHurtAnimationAction("play_hurt_animation");

    return playHurtAnimationInstance;
}

CEplayHurtAnimation();