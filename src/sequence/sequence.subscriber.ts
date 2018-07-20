import { Sequence } from './sequence.entity';
import { getMetadataArgsStorage, EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import assert = require('assert');

@EventSubscriber()
export class SequenceSubscriber implements EntitySubscriberInterface {

    async beforeInsert(event: InsertEvent<any>) {
        const EntityType: Function = event.entity.constructor;
        const columnMetadata = getMetadataArgsStorage().columns.find(c => c.target === EntityType && Boolean(c.options.primary))!;
        assert(columnMetadata);
        const metadata = Reflect.getMetadata('design:type', event.entity, columnMetadata.propertyName);
        assert(metadata === Number);
        const result = await event.connection.getMongoRepository(Sequence)
            .findOneAndUpdate({}, { $inc: { value: 1 } }, { upsert: true, returnOriginal: false });
        const id = (result.value as Sequence).value;
        event.entity[columnMetadata.propertyName] = id; // eslint-disable-line tslint/config
    }
}
