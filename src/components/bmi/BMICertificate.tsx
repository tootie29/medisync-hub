
import React from 'react';
import { getBMICategory } from '@/utils/helpers';

interface BMICertificateProps {
  id?: string;
  userName: string;
  bmi: number;
  height: number;
  weight: number;
  date: string;
}

const BMICertificate: React.FC<BMICertificateProps> = ({ 
  id, userName, bmi, height, weight, date 
}) => {
  return (
    <div 
      id={id} 
      className="certificate"
      style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      <div className="certificate-header">
        <h1 
          className="certificate-title"
          style={{
            fontSize: '36px',
            color: '#22c55e',
            marginBottom: '10px'
          }}
        >
          Health Certificate
        </h1>
        <h2 
          className="certificate-subtitle"
          style={{
            fontSize: '18px',
            color: '#555'
          }}
        >
          Body Mass Index (BMI) - Healthy Status
        </h2>
      </div>
      
      <div 
        className="certificate-body"
        style={{
          margin: '30px 0',
          padding: '20px',
          border: '2px solid #22c55e',
          borderRadius: '10px'
        }}
      >
        <div 
          className="user-name"
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          This is to certify that
          <br />
          <span style={{ display: 'block', margin: '10px 0', fontSize: '28px', color: '#333' }}>{userName}</span>
        </div>
        
        <div
          className="bmi-result"
          style={{
            fontSize: '20px',
            marginBottom: '10px'
          }}
        >
          has a BMI of <span className="bmi-value" style={{ fontWeight: 'bold', color: '#22c55e' }}>{bmi.toFixed(1)}</span>
        </div>
        
        <div
          className="bmi-details"
          style={{
            marginBottom: '20px'
          }}
        >
          Height: {height} cm | Weight: {weight} kg
        </div>
        
        <div className="bmi-category-result">
          This BMI falls within the <span className="bmi-category" style={{ fontWeight: 'bold', color: '#22c55e' }}>{getBMICategory(bmi)}</span> range.
        </div>
        
        <div 
          className="certificate-date"
          style={{
            marginTop: '20px',
            fontStyle: 'italic',
            color: '#555'
          }}
        >
          Issued on: {date}
        </div>
      </div>
      
      <div 
        className="certificate-footer"
        style={{
          marginTop: '40px'
        }}
      >
        <div 
          className="signature-line"
          style={{
            width: '200px',
            height: '1px',
            background: '#000',
            margin: '10px auto'
          }}
        ></div>
        <div className="doctor-name" style={{ fontWeight: 'bold' }}>
          Medical Clinic Authority
        </div>
      </div>
    </div>
  );
};

export default BMICertificate;
