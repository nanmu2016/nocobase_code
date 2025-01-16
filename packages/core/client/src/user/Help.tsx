/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import { parseHTML } from '@nocobase/utils/client';
import { Dropdown, Menu, Popover } from 'antd';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownVisibleContext, usePlugin, useToken } from '..';
import { useCurrentAppInfo } from '../appInfo/CurrentAppInfoProvider';
import { useCurrentUserContext } from '../user/CurrentUserProvider';

/**
 * @note If you want to change here, Note the Setting block on the mobile side
 */
const SettingsMenu: React.FC<{
  redirectUrl?: string;
}> = () => {
  const { t } = useTranslation();
  const data = useCurrentAppInfo();
  const { token } = useToken();

  // 是否是简体中文
  const isSimplifiedChinese = data?.data?.lang === 'zh-CN';

  const items = [
    {
      key: 'nocobase',
      disabled: true,
      label: (
        <div style={{ cursor: 'text' }}>
          <div style={{ color: token.colorText }}>NocoBase</div>
          <div style={{ fontSize: '0.8em', color: token.colorTextDescription }}>v{data?.data?.version}</div>
        </div>
      ),
    },
    {
      key: 'divider_1',
      type: 'divider',
    },
    {
      key: 'homePage',
      label: (
        <a
          href={isSimplifiedChinese ? 'https://www.nocobase.com/cn/' : 'https://www.nocobase.com'}
          target="_blank"
          rel="noreferrer"
        >
          {t('Home page')}
        </a>
      ),
    },
    {
      key: 'userManual',
      label: (
        <a
          href={isSimplifiedChinese ? 'https://docs-cn.nocobase.com/handbook' : 'https://docs.nocobase.com/handbook'}
          target="_blank"
          rel="noreferrer"
        >
          {t('Handbook')}
        </a>
      ),
    },
    {
      key: 'license',
      label: (
        <a
          href={isSimplifiedChinese ? 'https://www.nocobase.com/cn/agreement' : 'https://www.nocobase.com/en/agreement'}
          target="_blank"
          rel="noreferrer"
        >
          {t('License')}
        </a>
      ),
    },
  ];

  return <Menu items={items} />;
};

const helpClassName = css`
  display: inline-block;
  vertical-align: top;
  width: 46px;
  height: 46px;
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }
`;

// 修改水印初始化函数，接收用户信息作为参数
const initWatermark = (nickname: string, phone: string) => {
  // 如果已存在水印，先移除
  const existingWatermark = document.querySelector('.global-watermark');
  if (existingWatermark) {
    existingWatermark.remove();
  }

  // 创建 canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 调整画布尺寸
  canvas.width = 300; // 300
  canvas.height = 180; // 180
  
  if (ctx) {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置水印样式
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.font = '16px Arial';
    
    // 旋转角度调整为 -22 度，更接近钉钉效果
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(-22 * Math.PI / 180);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    
    // 使用用户的昵称和手机号
    const watermarkText = `${nickname} ${phone}`;
    
    // 计算文本宽度以便居中
    const textWidth = ctx.measureText(watermarkText).width;
    
    // 在画布中心绘制单行文本
    ctx.fillText(watermarkText, (canvas.width - textWidth) / 2, canvas.height / 2);
  }

  // 创建水印容器
  const watermark = document.createElement('div');
  watermark.className = 'global-watermark';
  
  // 设置水印样式，调整间距和大小
  watermark.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
    background-image: url(${canvas.toDataURL('image/png')});
    background-repeat: repeat;
    background-size: 300px 180px;
    background-position: 30px 30px;
    transform: translateZ(0);
  `;
  
  // 添加到页面
  document.body.appendChild(watermark);

  // 防止水印被删除
  const observer = new MutationObserver(() => {
    if (!document.querySelector('.global-watermark')) {
      document.body.appendChild(watermark.cloneNode(true));
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
};

export const Help = observer(
  () => {
    const [visible, setVisible] = useState(false);
    const { token } = useToken();
    const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
    const data = useCurrentAppInfo();
    
    // 获取当前用户信息
    const { data: currentUser } = useCurrentUserContext();
   

    useEffect(() => {
      let observer: MutationObserver | null = null;
      
      // 当用户信息加载完成后初始化水印
      if (currentUser) {
        const nickname = currentUser.data.nickname || '';
        const phone = currentUser.data.phone || '';
        
        // 只有当有昵称或手机号时才创建水印
        if (nickname || phone) {
          observer = initWatermark(nickname, phone);
        }
      }

      // 清理函数
      return () => {
        if (observer) {
          observer.disconnect();
        }
        const watermark = document.querySelector('.global-watermark');
        if (watermark) {
          watermark.remove();
        }
      };
    }, [currentUser]); // 依赖于 currentUser，当用户信息变化时重新创建水印

    const icon = (
      <span
        data-testid="help-button"
        className={css`
          max-width: 160px;
          overflow: hidden;
          display: inline-block;
          line-height: 12px;
          white-space: nowrap;
          text-overflow: ellipsis;
        `}
        style={{ cursor: 'pointer', padding: '16px', color: token.colorTextHeaderMenu }}
      >
        <QuestionCircleOutlined />
      </span>
    );

    if (customBrandPlugin?.options?.options?.about) {
      const appVersion = `<span class="nb-app-version">v${data?.data?.version}</span>`;
      const content = parseHTML(customBrandPlugin.options.options.about, { appVersion });

      return (
        <div className={helpClassName}>
          <Popover
            // nb-about 的样式定义在 plugin-custom-brand 插件中
            rootClassName="nb-about"
            placement="bottomRight"
            arrow={false}
            content={<div dangerouslySetInnerHTML={{ __html: content }}></div>}
          >
            {icon}
          </Popover>
        </div>
      );
    }

    return (
      <div className={helpClassName} style={{ display: 'none' }}>
        <DropdownVisibleContext.Provider value={{ visible, setVisible }}>
          <Dropdown
            open={visible}
            onOpenChange={(visible) => {
              setVisible(visible);
            }}
            dropdownRender={() => {
              return <SettingsMenu />;
            }}
          >
            {icon}
          </Dropdown>
        </DropdownVisibleContext.Provider>
      </div>
    );
  },
  { displayName: 'Help' },
);
