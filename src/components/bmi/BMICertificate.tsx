
import React from 'react';
import { getBMICategory } from '@/utils/helpers';
import { GraduationCap } from 'lucide-react';

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
  // If BMI is 0 or invalid, recalculate it from height and weight
  const calculatedBmi = (() => {
    if (bmi && bmi > 0) return bmi;
    
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return weight / (heightInMeters * heightInMeters);
    }
    
    return 0;
  })();
  
  // Only display the BMI if it's a valid number
  const displayBmi = calculatedBmi > 0 ? calculatedBmi.toFixed(1) : "0.0";
  
  return (
    <div 
      id={id} 
      className="certificate"
      style={{
        padding: '40px',
        width: '800px',
        margin: '0 auto',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #eaeaea',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        opacity: '0.05',
        backgroundImage: 'repeating-radial-gradient(circle at 0 0, transparent 0, #e5e7eb 10px), repeating-linear-gradient(#22c55e55, #22c55e55)',
        zIndex: '1'
      }}></div>
      
      {/* Certificate Content */}
      <div style={{ position: 'relative', zIndex: '2' }}>
        {/* Logo/Header */}
        <div className="certificate-header" style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '20px'
          }}>
            {/* Certificate Icon */}
            <div style={{
              width: '60px',
              height: '60px',
              marginRight: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22c55e',
              border: '2px solid #22c55e',
              borderRadius: '50%'
            }}>
              <GraduationCap size={36} />
            </div>
            
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#22c55e',
                margin: '0',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Health Certificate
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0',
                fontStyle: 'italic'
              }}>
                Body Mass Index (BMI) - Healthy Status
              </p>
            </div>
          </div>
          
          <div style={{
            height: '4px',
            background: 'linear-gradient(to right, #22c55e, #4ade80, #22c55e)',
            borderRadius: '2px',
            margin: '0 auto 10px auto',
            width: '80%'
          }}></div>
        </div>
        
        <div 
          className="certificate-body"
          style={{
            margin: '30px auto',
            padding: '30px',
            border: '2px solid #22c55e',
            borderRadius: '10px',
            backgroundColor: 'rgba(240, 253, 244, 0.5)',
            maxWidth: '90%',
            position: 'relative'
          }}
        >
          {/* Certificate corners */}
          <div style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            width: '20px',
            height: '20px',
            borderTop: '3px solid #22c55e',
            borderLeft: '3px solid #22c55e'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '20px',
            height: '20px',
            borderTop: '3px solid #22c55e',
            borderRight: '3px solid #22c55e'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-3px',
            left: '-3px',
            width: '20px',
            height: '20px',
            borderBottom: '3px solid #22c55e',
            borderLeft: '3px solid #22c55e'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
            width: '20px',
            height: '20px',
            borderBottom: '3px solid #22c55e',
            borderRight: '3px solid #22c55e'
          }}></div>
          
          <div style={{
            fontSize: '16px',
            fontWeight: 'normal',
            marginBottom: '25px',
            color: '#333'
          }}>
            This is to certify that
          </div>
          
          <div 
            className="user-name"
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '25px',
              color: '#111',
              padding: '10px 20px',
              borderBottom: '1px solid #22c55e',
              borderTop: '1px solid #22c55e',
              display: 'inline-block'
            }}
          >
            {userName}
          </div>
          
          <div style={{ margin: '25px 0' }}>
            <div
              className="bmi-result"
              style={{
                fontSize: '20px',
                marginBottom: '15px',
                color: '#333'
              }}
            >
              has a BMI of <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{displayBmi}</span>
            </div>
            
            <div
              className="bmi-details"
              style={{
                marginBottom: '20px',
                color: '#444',
                fontSize: '16px'
              }}
            >
              Height: <span style={{ fontWeight: 'bold' }}>{height} cm</span> | Weight: <span style={{ fontWeight: 'bold' }}>{weight} kg</span>
            </div>
            
            <div className="bmi-category-result" style={{ fontSize: '18px', color: '#333' }}>
              This BMI falls within the <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{getBMICategory(calculatedBmi)}</span> range.
            </div>
          </div>
          
          <div 
            className="certificate-date"
            style={{
              marginTop: '25px',
              fontStyle: 'italic',
              color: '#666',
              fontSize: '14px'
            }}
          >
            Issued on: {date}
          </div>
        </div>
        
        <div 
          className="certificate-footer"
          style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end'
          }}
        >
          <div style={{ textAlign: 'center', flex: '1' }}>
            <div 
              className="signature-line"
              style={{
                width: '180px',
                height: '1px',
                background: '#000',
                margin: '10px auto'
              }}
            ></div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              Medical Officer
            </div>
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Official Seal/Stamp */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              backgroundColor: 'rgba(240, 253, 244, 0.5)',
              color: '#22c55e',
              fontSize: '10px',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={36} />
                <div style={{ marginTop: '5px', fontSize: '8px', fontWeight: 'bold' }}>OFFICIAL SEAL</div>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', flex: '1' }}>
            <div 
              className="signature-line"
              style={{
                width: '180px',
                height: '1px',
                background: '#000',
                margin: '10px auto'
              }}
            ></div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              Medical Clinic Authority
            </div>
          </div>
        </div>
        
        {/* Certificate ID and validation note */}
        <div style={{ marginTop: '30px', fontSize: '10px', color: '#888', textAlign: 'center' }}>
          <p>Certificate ID: HC-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          <p>This certificate is valid as of the issue date and can be verified online.</p>
        </div>
      </div>
    </div>
  );
};

export default BMICertificate;
