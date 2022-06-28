import sys
import json
from pykern import pkcollections
from pykern.pkdebug import pkdlog, pkdp
from pykern.pkcollections import PKDict

_ENUM_INDEX_TO_PROPERTY = {
    0: 'value',
    1: 'label',
}
_FIELD_INDEX_TO_PROPERTY = {
    0: 'label',
    1: 'type',
    2: 'default',
    3: 'toolTip',
    4: 'min',
    5: 'max',
}

_ENUM = 'enum'
_MODEL = 'model'


def _load_schema(file_name):
    with open(file_name, 'r') as f:
        return pkcollections.json_load_any(f)


def arrays_to_convert(schema, key):
    assert key in schema, pkdlog('No {} in JSON', key)
    return schema[key]


def _array_to_object(arr, map):
    obj = {}
    for i in [j for j in range(len(arr)) if j in map]:
        obj[map[i]] = arr[i]  # get rid of unicode
    return obj


def enum_array_to_obj(schema):
    enums = arrays_to_convert(schema, _ENUM)
    enums_obj = PKDict()
    for e in enums:
        for enum_array in enums[e]:
            enums_obj[e] = _array_to_object(enum_array, _ENUM_INDEX_TO_PROPERTY)
    schema[_ENUM] = enums_obj


def field_array_to_obj(schema):
    models = arrays_to_convert(schema, _MODEL)
    models_obj = PKDict()
    for model_name in models:
        model_obj = PKDict()
        for field_name in models[model_name]:
            model_obj[field_name] = _array_to_object(models[model_name][field_name], _FIELD_INDEX_TO_PROPERTY)
        models_obj[model_name] = model_obj
    models = models_obj
    schema[_MODEL] = models


def validate_models(schema):
    models = schema.model
    enums = schema.enum
    for model_name in models:
        for field_name in models[model_name]:
            t = models[model_name][field_name].type
            assert t in enums, 'type {} not in enums {}'.format(t, enums)


def main():
    assert len(sys.argv) > 1, 'Usage: need a file name'
    file_name = str(sys.argv[1])
    schema = _load_schema(file_name)
    validate_models(schema)
    enum_array_to_obj(schema)
    field_array_to_obj(schema)


if __name__ == "__main__":
    main()
