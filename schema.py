from pykern.pkcollections import PKDict
from pykern.pkdebug import pkdp
from pykern import pkconfig


class SRSchema(PKDict):
    def __init__(self, **kwargs):
        super(SRSchema, self).__init__(**kwargs)
        self.types = PKDict()
        self.models = PKDict()
        self.views = PKDict()

    def to_json(self):
        pass


class PKType():
    def validate(self, val):
        # require override?
        #assert 0, 'subclass must override validate()'
        return val


class PKBoolean(PKType):
    def validate(self, val):
        assert isinstance(val, bool)
        return val


class PKFloat(PKType):
    def validate(self, val):
        return float(val)


class PKInt(PKType):
    def validate(self, val):
        assert isinstance(val, int)
        return val


class PKRangedInt(PKInt):
    # py3 has no limits on ints
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


class SRModel(PKDict):
    def set_field_value(self, field_name, val):
        self[field_name].value = val


class SRFieldDefinition(PKDict):
    def __init__(self, field_type, init_val, **kwargs):
        super(SRFieldDefinition, self).__init__(**kwargs)
        self.field_type = field_type
        self.value = init_val

    def __setattr__(self, name, value):
        if name == 'field_type':
            assert not hasattr(self, name), KeyError('cannot modify field type')
        super().__setattr__(name, self.field_type.validate(value) if name == 'value' else value)


class PKChoices():
    def __init__(self, choices):
        self.choices = frozenset(choices)

    def validate(self, val):
        assert val in self.choices, ValueError(f'value={val} not in {self.choices}')
        return val

