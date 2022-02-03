import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import {Dropdown} from 'primereact/dropdown';
import {Checkbox} from 'primereact/checkbox';
import {RadioButton} from 'primereact/radiobutton';

function Demo() {
    let [ selectedOption, setSelectedOption ] = useState(null);
    let options = [
        { key: '1', value: 'option1', label: 'Option1' },
        { key: '2', value: 'option2', label: 'A very long long option label in options list' },
        { key: '3', value: 'option3', label: 'Option3' },
        { key: '4', value: 'option4', label: 'Option4' }
    ];
    return (
        <div style={{ backgroundColor: 'white', color: '#303030', padding: '1em', overflowY: 'auto', flex: 1 }}>
            <div className="p-fluid p-formgrid p-grid">

                <div className="p-field p-col-12 p-md-6">
                    <label htmlFor="firstname6">Firstname</label>
                    <InputText id="firstname6" type="text" placeholder="First name" />
                </div>

                <div className="p-field p-col-12 p-md-6">
                    <label htmlFor="lastname6">Lastname</label>
                    <InputText id="lastname6" type="text" placeholder="Last name" />
                </div>

                <div className="p-field p-col-12">
                    <label htmlFor="address">Address</label>
                    <InputTextarea id="address" rows="3" placeholder="Address..." />
                </div>

                <div className="p-field p-col-12 p-md-12">
                    <div className="p-formgroup-inline">
                        { options.map(opt => (
                            <div className="p-field-checkbox" key={opt.value}>
                                <Checkbox 
                                    inputId={'check'+opt.value} 
                                    value={opt.value} 
                                    onChange={opt => setSelectedOption(opt)} 
                                    checked={(selectedOption ? selectedOption.value : '') === opt.value}
                                />
                                <label htmlFor={'check'+opt.value}>{opt.label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-field p-col-12 p-md-12">
                    <div>
                        { options.map(opt => (
                            <div className="p-field-radiobutton" key={opt.value}>
                                <RadioButton
                                    inputId={'radio'+opt.value} 
                                    value={opt.value} 
                                    onChange={opt => setSelectedOption(opt)} 
                                    checked={(selectedOption ? selectedOption.value : '') === opt.value}
                                />
                                <label htmlFor={'radio'+opt.value}>{opt.label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-field p-col-12 p-md-12">
                    <label htmlFor="state">Options</label>
                    <Dropdown 
                        inputId="state" 
                        value={selectedOption ? selectedOption.value : ''} 
                        options={options} 
                        onChange={opt => setSelectedOption(opt)} 
                        placeholder="Select" 
                        optionLabel="label"
                    />
                </div>

            </div>
        </div>
    )
}

export default Demo;