import schema
from pykern.pkcollections import PKDict

class MyAppSchema(schema.SRSchema):

    def __init__(self, **kwargs):
        super(MyAppSchema, self).__init__(**kwargs)

        self.types.update(
            Gender=schema.PKChoices(['male', 'female',]),
            DogDisposition=schema.PKChoices(['aggressive', 'friendly', 'submissive',])
        )

        self.models.update(
            dog=schema.SRModel(
                breed=schema.SRFieldDefinition(schema.PKString(), ''),
                gender=schema.SRFieldDefinition(self.types.Gender, 'male'),
                height=schema.SRFieldDefinition(schema.PKRangedFloat(min_val=0), 0.5, units='m'),
                weight=schema.SRFieldDefinition(schema.PKRangedFloat(min_val=0), 60.5, units='lb'),
                disposition=schema.SRFieldDefinition(schema.PKChoices(['aggressive', 'friendly', 'submissive',]), 'friendly'),
                favoriteTreat=schema.SRFieldDefinition(schema.PKString(), ''),
            ),
        )
