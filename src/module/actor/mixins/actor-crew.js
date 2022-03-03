export const ActorCrewMixin = (superclass) => class extends superclass {
    async removeFromCrew(actorId) {
        const role = this.getCrewRoleForActor(actorId);
        if (role) {
            const crewData = duplicate(this.data.data.crew);
            crewData[role].actorIds = crewData[role].actorIds.filter(x => x !== actorId);
            return this.update({
                "data.crew": crewData
            });
        }
        return null;
    }
    
    getCrewRoleForActor(actorId) {
        const dataSource = this.data;
        const acceptedActorTypes = ["starship", "vehicle"];
        if (!acceptedActorTypes.includes(dataSource.type)) {
            console.log(`getCrewRoleForActor(${actorId}) called on an actor (${dataSource.id}) of type ${dataSource.type}, which is not supported!`);
            console.trace();
            return null;
        }

        if (!dataSource?.data?.crew) {
            return null;
        }

        for (const [role, entry] of Object.entries(dataSource.data.crew)) {
            if (entry?.actorIds?.includes(actorId)) {
                return role;
            }
        }
        return null;
    }

    getActorIdsForCrewRole(role) {
        const acceptedActorTypes = ["starship", "vehicle"];
        if (!acceptedActorTypes.includes(this.data.type)) {
            console.log(`getActorIdsForCrewRole(${role}) called on an actor (${this.data.id}) of type ${this.data.type}, which is not supported!`);
            console.trace();
            return null;
        }

        if (!this.data?.data?.crew) {
            return null;
        }

        if (!(role in this.data.data.crew)) {
            return null;
        }

        return duplicate(this.data.data.crew[role]);
    }
}
