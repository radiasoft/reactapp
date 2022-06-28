# -*- coding: utf-8 -*-
u"""Classes defining a Sirepo application

:copyright: Copyright (c) 2022 RadiaSoft LLC.  All Rights Reserved.
:license: http://www.apache.org/licenses/LICENSE-2.0.html
"""

from pykern.pkcollections import PKDict

# A class defining an app based on its schema.
class SRApp(PKDict):

    def __init__(self, name, schema):
        self.name = name
        self.controllers = PKDict()
        self.enums = PKDict()
        self.models = PKDict()
        self.sections = PKDict()
        self.views = PKDict()

        for x in schema.enum:
            self.enums[x] = SREnum(x, schema.enum[x])

        for x in schema.view:
            this.views[x] = SRView(x, schema.view[x])


    def get_field_from_model(self, model_name, field_name):
        return self.getModel(model_name).getField(field_name)


    def get_field_from_ref(self, field_ref):
        m = field_ref.split('.')
        if len(m) > 2:
            return self.getFieldFromRef(m.slice(1).join('.'))
        if len(m) > 1:
            return self.getFieldFromModel([m[0]], [m[1]])
        return None


    def get_model(self, model_name):
        return self.models[model_name]


    def set_field_value(self, model_name, field_name, value):
        self.getModel(model_name).getField(field_name).setValue(value)


    def set_field_ref_value(self, field_ref, value):
        self.get_field_from_ref(field_ref).setValue(value)


class SRModel(PKDict):

    @classmethod
    def field_Ref(cls, model_name, field_name):
        return f'{model_name}.{field_name}'

    @classmethod
    def qualify_field_ref(cls, model_name, field_name):
        return field_name if '.' in field_name else SRModel.field_ref(model_name, field_name)

    def __init__(self, name, schema):
        self.name = name
        self.fields = PKDict()
        for f in schema:
            self.fields[f] = SRField(f, schema[f])


    def get_field(self, field_name):
        return self.fields[field_name]


    def field_Ref(self, field_name):
        return SRModel.field_Ref(this.name, field_name)



#
# Organized collection of pages or field references. A field reference is either the name of a field
# or a '.'-delimited string of model names terminated by a field name (i.e. <model 1>.<model 2>...<field>.
# Field references are qualified with a default model name if they are not already so constructed.
# The schema is assumed to have either field refs or pages, NOT both
class SRForm(PKDict):

    """
     * @param {*} schema - schema defining this form
     * @param {string} defaultModel - model name to use for unqualified field names
     """
    def __init__(self, schema, default_model_name):
        from pykern import pkconfig
        self.pages = None
        self.field_refs = []
        for f in schema:
            if isinstance(f, pkconfig.STRING_TYPES):
                self.field_refs.append(SRModel.qualify_field_ref(default_model_name, f))
                continue
            if self.pages is None:
                self.pages = []
            self.pages.append(SRPage(f, default_model_name))


    """
     * Get a page in this form by name
     * @param {string} pageName - the page
    """
    def get_page(self, pageName):
        return self.pages[pageName]

#
# Organized collection of forms. The hierarchy is:
#    view -> forms (basic|advanced) -> pages -> field references
class SRView(PKDict):

    """
     * @param {string} name - name of the view
     * @param {*} schema - schema defining this view
    """
    def __init__(self, name, schema):
        self.name = self
        self.title = schema.title
        self.default_model_name = schema.model or name

        for f in ('basic', 'advanced',):
            if schema[f]:
                self[f] = SRForm(schema[f], self.default_model_name)

    """
     * Get the form of this type
     * @param {string} formType - basic|advanced
     * @return {SRForm} - the form for this type
    """
    def get_form(self, form_type):
        return self[form_type]


    """
     * Get a page from the form of this type
     * @param {string} formType - basic|advanced
     * @param {string} pageName - name of the page
     * @return {SRPage}
    """
    def get_page(self, form_type, page_name):
        return self.getForm(form_type).getPage(form_type)


class SRFieldDefinition(PKDict):

    @classmethod
    def built_in(cls, baseType, is_required=True):
        return PKDict()

    """
     * @param {[*]} def - array of field properties. Canonically these are
     *     [
     *         <field label> (str),
     *         <field type> (str),
     *         <default value> (*),
     *         [<tool tip>] (str),
     *         [<min>] (number),
     *         [<max>] (number)
     *     ]
     *
     * Not all properties have meaning for all field types. Further, some apps use custom properties beyond
     * the range of this class
    """
    def __init__(self, definition):
        INDEX_TO_PROPERTY = ('label',  'type', 'default', 'toolTip', 'min', 'max',)
        for i in range(len(INDEX_TO_PROPERTY)):
            self.addProperty([INDEX_TO_PROPERTY[i]], definition[i] or None)


    """
     * Add a property to this field definition
     * @param {string} name - name of the proprty
     * @param {*} value - its value
    """
    def add_property(self, name, value):
        self[name] = value


    def editor(self, is_required=True):
        ui = PKDict()  #new SIREPO.DOM.UIDiv()
        ui.addChild(
            PKDict(
                Integer=SRFieldDefinition.builtIn('number', is_required),
                Float=SRFieldDefinition.builtIn('number', is_required),
            )[self.type]
        )
        return ui

class SRField():

    def __init__(self, name, definition):
        self.name = name
        self.definition = SRFieldDefinition(definition)
        self.value = self.definition.default


    def get_value(self):
        return self.value


    def set_value(self, val):
        self.value = val


#takes an array of the form [<value>, <label>]
class SREnumEntry(PKDict):

    def __init__(self, sch_enum):
        self.label = sch_enum[0]
        self.value = sch_enum[1]



class SREnum(PKDict):

    """
    schEntries is a dict:
    // {
    //    <enumName> : [
    //      [<value>, <label>],
    //      ...
    //    ],
    //    ...
    """
    @classmethod
    def entries_from_schema(cls, sch_entries):
        entries = PKDict()
        for e in sch_entries:
            entry = SREnumEntry(e)
            entries[entry.label] = entry
        return entries


    def __init__(self, name, schema):
        self.name = name
        self.entries = PKDict()
        self.add_entries(schema)


    def add_entry(self, sch_enum):
        e = SREnumEntry(sch_enum)
        self.entries[e.label] = e


    def add_entries(self, schema):
        self.entries.update(SREnum.entriesFromSchema(schema))


    def clear_entries(self):
        self.entries.clear()


    def get_entry(self, label):
        return self.entries[label]


    def set_entries(self, sch_entries):
        self.clearEntries()
        self.addEntries(sch_entries)

