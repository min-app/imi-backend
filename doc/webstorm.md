#### 生成model
```
import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

export default (sequelize: Sequelize) => {
  return MG
    .schema('$schema$', {
      description: '$description$',
      plugin: {
        addMutation: true,
        updateMutation: true,
        deleteMutation: true,
        singularQuery: true,
        pluralQuery: true
      },
      table: {
        hooks: {}
      }
    })
    .fields(fields)
    .hasMany({})
    .hasOne({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .links({})
    .methods({})
    .statics({})
}

const fields = {
  
}
```