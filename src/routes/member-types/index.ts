import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const id = request.params.id;
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: id,
      });
      if (Object.is(memberType, null)) {
        reply.notFound("MemberType doesn't exist")
      }
      return memberType as MemberTypeEntity;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const id = request.params.id;
      const body = request.body;
      const post = await fastify.db.memberTypes.findOne({key:'id', equals:id}) as MemberTypeEntity;
      return await fastify.db.memberTypes.change(id, Object.assign(post, body));
    }
  );
};

export default plugin;
