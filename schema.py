from pykern.pkcollections import PKDict
from pykern import pkconfig

class SRSchema(PKDict):

    def __init__(self, **kwargs):
        super(SRSchema, self).__init__(**kwargs)
        self.types = PKDict()
        self.models = PKDict()



class PKType():
    def validate(self, val):
        # require override?
        #assert 0, 'subclass must override validate()'
        return val


class PKFloat(PKType):
    def validate(self, val):
        return float(val)


class PKInt(PKType):
    def validate(self, val):
        assert isinstance(val, int)
        return val


class PKRangedInt(PKInt):
    def __init__(self, min_val=None, max_val=None):
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, val):
        v = super().validate(val)
        assert (self.min_val is None or v >= self.min_val) and (self.max_val is None or v <= self.max_val)
        return v


class PKRangedFloat(PKFloat):
    import sys
    def __init__(self, min_val=sys.float_info.min, max_val=sys.float_info.max):
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, val):
        assert self.min_val <= super().validate(val) <= self.max_val, ValueError(f'value={val} outside of range [{self.min_val}, {self.max_val}]')
        return val


class SRType(PKType):
    pass


class PKString(PKType):
    def validate(self, val):
        assert isinstance(val, pkconfig.STRING_TYPES), ValueError('value={} is not a string'.format(val))
        return val


class PKStruct(PKType):
    def __init__(self, **kwargs):
        super(PKStruct, self).__init__(**kwargs)
        self.values = PKDict()


class SRModel():
    pass


class SRModelField(PKDict):
    def __init__(self, field_type, init_val, **kwargs):
        self.field_type = field_type
        self.value = init_val
        super(SRModelField, self).__init__(**kwargs)

    def __setattr__(self, key, value):
        if key == 'field_type':
            assert not hasattr(self, key), KeyError('cannot modify field type')
            self.__dict__[key] = value
        if key == 'value':
            self.__dict__[key] = self.field_type.validate(value)



class PKChoices():
    def __init__(self, choices):
        self.choices = choices

    def validate(self, val):
        assert val in self.choices, ValueError(f'value={val} not in {self.choices}')
        return val


class MyAppSchema(SRSchema):

    def __init__(self, **kwargs):
        super(MyAppSchema, self).__init__(**kwargs)

        self.types.update(
            Gender=PKChoices(['male', 'female',]),
            DogDisposition=PKChoices(['aggressive', 'friendly', 'submissive',])
        )

        self.models.update(
            dog=PKDict(
                breed=SRModelField(PKString(), ''),
                gender=SRModelField(self.types.Gender, 'male'),
                height=SRModelField(PKRangedFloat(min_val=0), 0.5, units='m'),
                weight=SRModelField(PKRangedFloat(min_val=0), 60.5, units='lb'),
                disposition=SRModelField(self.types.DogDisposition, 'friendly'),
                favoriteTreat=SRModelField(PKString(), ''),
            ),
        )

\