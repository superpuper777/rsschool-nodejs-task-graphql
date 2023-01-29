import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const id = request.params.id;
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(profile, null)) {
        reply.notFound("Profile doesn't exist");
      }
      return profile as ProfileEntity;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const body = request.body;
      const { userId, memberTypeId } = body;

      const users = await fastify.db.users.findMany();
      const profiles = await fastify.db.profiles.findMany();
      const memberTypes = await fastify.db.memberTypes.findMany();

      const isUserExist = users.find((u) => u.id === userId);
      const isProfileExist = profiles.find((p) => p.userId === userId);
      const isMemberTypeExist = memberTypes.find((m) => m.id === memberTypeId);

      if (!isUserExist || isProfileExist || !isMemberTypeExist) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.profiles.create(body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const id = request.params.id;
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(profile, null)) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.profiles.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const id: string = request.params.id;
      const body = request.body;
      const profile = (await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      })) as ProfileEntity;
      if (Object.is(profile, null)) {
        throw fastify.httpErrors.badRequest();
      }
      return await fastify.db.profiles.change(id, Object.assign(profile, body));
    }
  );
};

export default plugin;
